/*
  FILE: chat.js
  PATH: /app/public/videogioco/chat.js
  DESC: Chat completa: testo, voce, allegati, LIM moderna, avatar, XP/Level/Missioni.
*/

document.addEventListener("DOMContentLoaded", () => {

  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatVoice = document.getElementById("chat-voice");
  const chatAttach = document.getElementById("chat-attach");
  const chatFile = document.getElementById("chat-file");

  const avatarImg = document.getElementById("avatar-img");
  const limScreen = document.getElementById("lim-screen");

  /* ============================================================
     UTILS
  ============================================================ */
  function clean(t) {
    return typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";
  }

  function addMessage(text, sender = "bot") {
    if (!chatBox) return;
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = clean(text);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /* ============================================================
     ANIMAZIONI NPC
  ============================================================ */
  function npcEnter() {
    if (!avatarImg) return;
    avatarImg.classList.add("avatar-enter");
    setTimeout(() => avatarImg.classList.remove("avatar-enter"), 500);
  }

  function npcTalk() {
    if (!avatarImg) return;
    avatarImg.classList.add("avatar-talking");
    setTimeout(() => avatarImg.classList.remove("avatar-talking"), 400);
  }

  /* ============================================================
     CAMBIO AVATAR
  ============================================================ */
  function changeAvatar(botName) {
    if (!avatarImg) return;

    const gender = localStorage.getItem("player_avatar");

    const map = {
      vendor: gender === "female" ? "donna manager" : "uomo manager",
      influencer: gender === "female" ? "influencer donna" : "influencer uomo",
      professor: gender === "female" ? "professoressa" : "professore",
      newsletter: gender === "female" ? "postina" : "postino",
      generic: gender === "female" ? "donna saggia" : "uomo saggio"
    };

    const file = map[botName] || map.generic;

    avatarImg.src = `/videogioco/${file}.png`;
    npcEnter();
  }

  window.changeAvatar = changeAvatar;

  /* ============================================================
     RENDER XP / LEVEL / MISSIONI
  ============================================================ */
  function renderXP(data) {
    const div = document.createElement("div");
    div.className = "lim-block xp-block";
    div.innerHTML = `<h3>⭐ XP guadagnati!</h3><p>+${data.xp} XP</p>`;
    limScreen.appendChild(div);
    npcTalk();
  }

  function renderLevelUp(data) {
    const div = document.createElement("div");
    div.className = "lim-block levelup-block";
    div.innerHTML = `<h3>🎉 LIVELLO SUPERATO!</h3><p>Sei ora livello <b>${data.level}</b></p>`;
    limScreen.appendChild(div);
    npcTalk();
  }

  function renderMissionComplete(data) {
    const div = document.createElement("div");
    div.className = "lim-block mission-complete-block";
    div.innerHTML = `<h3>🏆 Missione completata!</h3><p>${data.mission}</p>`;
    limScreen.appendChild(div);
    npcTalk();
  }

  /* ============================================================
     RENDER LIM — FORMATO UNICO
  ============================================================ */
  function renderOnLIM(data) {
    limScreen.innerHTML = "";

    // XP / LEVEL update
    if (typeof data.xp === "number") localStorage.setItem("player_xp", String(data.xp));
    if (typeof data.level === "number") localStorage.setItem("player_level", String(data.level));
    if (typeof window.updateHUD === "function") window.updateHUD();

    if (data.type === "xp") return renderXP(data);
    if (data.type === "level_up") return renderLevelUp(data);
    if (data.missionCompleted) renderMissionComplete(data);

    // VIDEO
    if (data.type === "video" && data.url) {
      const div = document.createElement("div");
      div.className = "lim-block";
      div.innerHTML = `
        <h3>🎥 Video tutorial</h3>
        <p>Apri il video per vedere la spiegazione completa.</p>
        <a href="${data.url}" target="_blank" class="lim-cta">Apri video</a>
      `;
      limScreen.appendChild(div);
      npcTalk();
      return;
    }

    // TESTO
    if (data.type === "text" && data.text) {
      const p = document.createElement("p");
      p.innerHTML = clean(data.text);
      limScreen.appendChild(p);
      npcTalk();
      return;
    }

    // MISSIONE (blocks)
    if (data.type === "mission" && Array.isArray(data.blocks)) {
      data.blocks.forEach(block => {
        const div = document.createElement("div");
        div.className = "lim-block";

        if (block.title) div.innerHTML += `<h3>${block.title}</h3>`;
        if (block.text) div.innerHTML += `<p>${clean(block.text)}</p>`;
        if (block.cta) {
          div.innerHTML += `<a href="${block.cta.href}" target="_blank" class="lim-cta">${block.cta.label}</a>`;
        }

        limScreen.appendChild(div);
      });
      npcTalk();
      return;
    }

    // FALLBACK
    limScreen.innerHTML = `<p>${clean(data.fallback || "Nessuna risposta disponibile.")}</p>`;
    npcTalk();
  }

  /* ============================================================
     API CHAT
  ============================================================ */
  async function apiChat(path, options = {}) {
    try {
      const res = await fetch(path, options);
      if (!res.ok) {
        addMessage("❌ Errore server.");
        return null;
      }
      const json = await res.json();
      return json.data || json;
    } catch {
      addMessage("❌ Errore rete.");
      return null;
    }
  }

  /* ============================================================
     INVIO TESTO
  ============================================================ */
  async function sendTextMessage() {
    const message = clean(chatInput.value);
    if (!message) return;

    addMessage(message, "user");
    chatInput.value = "";
    localStorage.setItem("last_message", message);

    const bot = localStorage.getItem("active_bot") || "generic";
    const gender = localStorage.getItem("player_avatar") === "female" ? "female" : "male";

    const data = await apiChat("/api/chat/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, bot, gender })
    });

    if (!data) return;

    if (data.avatar) changeAvatar(data.avatar);
    renderOnLIM(data);
  }

  if (chatSend) chatSend.addEventListener("click", sendTextMessage);
  if (chatInput) {
    chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendTextMessage();
      }
    });
  }

  /* ============================================================
     INVIO ALLEGATI (📎)
  ============================================================ */
  if (chatAttach && chatFile) {
    chatAttach.addEventListener("click", () => chatFile.click());

    chatFile.addEventListener("change", async () => {
      if (!chatFile.files.length) return;

      const file = chatFile.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", "");

      addMessage("📎 File inviato: " + file.name, "user");

      const res = await fetch("/api/chat/attachment", {
        method: "POST",
        body: formData
      });

      const json = await res.json();
      if (!json.success) {
        addMessage("❌ Errore allegato.");
        return;
      }

      if (json.avatar) changeAvatar(json.avatar);
      renderOnLIM(json);
    });
  }

  /* ============================================================
     INVIO VOCALE (🎤)
  ============================================================ */
  let mediaRecorder = null;
  let audioChunks = [];

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });

        addMessage("🎤 Elaborazione audio…", "bot");

        const res = await fetch("/api/chat/voice", {
          method: "POST",
          body: blob
        });

        const json = await res.json();
        if (!json.success) {
          addMessage("❌ Errore voce.");
          return;
        }

        addMessage(json.text, "user");

        if (json.avatar) changeAvatar(json.avatar);
        renderOnLIM(json);
      };

      mediaRecorder.start();
      addMessage("🎤 Registrazione avviata…", "bot");

    } catch {
      addMessage("❌ Microfono non disponibile.", "bot");
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      addMessage("🎤 Registrazione terminata", "bot");
    }
  }

  if (chatVoice) {
    chatVoice.addEventListener("mousedown", startRecording);
    chatVoice.addEventListener("mouseup", stopRecording);
    chatVoice.addEventListener("touchstart", startRecording);
    chatVoice.addEventListener("touchend", stopRecording);
  }

  /* ============================================================
     MESSAGGIO DI BENVENUTO DEL SAGGIO
  ============================================================ */
  const welcomePending = localStorage.getItem("welcome_sage_pending");
  if (welcomePending === "1" && avatarImg && limScreen) {
    const gender = localStorage.getItem("player_avatar");
    const npc = gender === "female" ? "donna saggia" : "uomo saggio";
    avatarImg.src = `/videogioco/${npc}.png`;
    npcEnter();

    limScreen.innerHTML = `
      <p>Benvenuto nel gioco! Io sarò la tua guida.</p>
      <p>Scrivi in basso e io, insieme agli altri bot, ti risponderemo dalla LIM.</p>
    `;

    npcTalk();
    localStorage.removeItem("welcome_sage_pending");
  }

});
