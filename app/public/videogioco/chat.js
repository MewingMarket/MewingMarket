/*
  FILE: chat.js
  PATH: /app/public/videogioco/chat.js
  DESC: Logica chat + LIM moderna: messaggi, avatar, animazioni, missioni.
*/

document.addEventListener("DOMContentLoaded", () => {

  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
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
     RENDER LIM — SUPPORTA MISSIONI
  ============================================================ */
  function renderOnLIM(data) {
    if (!limScreen || !data) return;
    limScreen.innerHTML = "";

    /* ============================
       1) TESTO SEMPLICE
    ============================ */
    if (data.type === "text" && data.text) {
      const p = document.createElement("p");
      p.innerHTML = clean(data.text);
      limScreen.appendChild(p);
      npcTalk();
      return;
    }

    /* ============================
       2) MISSIONE (blocks)
    ============================ */
    if (data.type === "mission" && Array.isArray(data.blocks)) {
      data.blocks.forEach(block => {
        const div = document.createElement("div");
        div.className = "lim-block";

        if (block.title) {
          const h3 = document.createElement("h3");
          h3.textContent = block.title;
          div.appendChild(h3);
        }

        if (block.text) {
          const p = document.createElement("p");
          p.innerHTML = clean(block.text);
          div.appendChild(p);
        }

        if (block.cta) {
          const a = document.createElement("a");
          a.href = block.cta.href;
          a.textContent = block.cta.label;
          a.target = "_blank";
          a.className = "lim-cta";
          div.appendChild(a);
        }

        limScreen.appendChild(div);
      });

      npcTalk();
      return;
    }

    /* ============================
       3) FALLBACK
    ============================ */
    const p = document.createElement("p");
    p.innerHTML = clean(data.fallback || "Nessuna risposta disponibile.");
    limScreen.appendChild(p);
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
     INVIO MESSAGGIO
  ============================================================ */
  async function sendTextMessage() {
    if (!chatInput) return;

    const message = clean(chatInput.value);
    if (!message) return;

    addMessage(message, "user");
    chatInput.value = "";

    const bot = localStorage.getItem("active_bot") || "generic";
    const gender = localStorage.getItem("player_avatar") === "female" ? "female" : "male";

    const data = await apiChat("/api/chat/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        bot,
        gender
      })
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
     MESSAGGIO DI BENVENUTO DEL SAGGIO
  ============================================================ */
  const welcomePending = localStorage.getItem("welcome_sage_pending");
  if (welcomePending === "1" && avatarImg && limScreen) {
    const gender = localStorage.getItem("player_avatar");
    const npc = gender === "female" ? "donna saggia" : "uomo saggio";
    avatarImg.src = `/videogioco/${npc}.png`;
    npcEnter();

    limScreen.innerHTML = "";
    const p1 = document.createElement("p");
    p1.innerHTML = "Benvenuto nel gioco! Io sarò la tua guida.";
    const p2 = document.createElement("p");
    p2.innerHTML = "Scrivi in basso e io, insieme agli altri bot, ti risponderemo dalla LIM.";
    limScreen.appendChild(p1);
    limScreen.appendChild(p2);

    npcTalk();
    localStorage.removeItem("welcome_sage_pending");
  }

});
