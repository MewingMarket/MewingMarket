/*
  FILE: chat.js
  PATH: /app/public/videogioco/chat.js
  DESC: Logica chat + LIM: messaggi, avatar, animazioni, video tutorial.
*/

document.addEventListener("DOMContentLoaded", () => {

  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const avatarImg = document.getElementById("avatar-img");
  const limScreen = document.getElementById("lim-screen");

  function clean(t) {
    return typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";
  }

  function addMessage(text, sender = "bot") {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = clean(text);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function npcEnter() {
    avatarImg.classList.add("avatar-enter");
    setTimeout(() => avatarImg.classList.remove("avatar-enter"), 500);
  }

  function npcTalk() {
    avatarImg.classList.add("avatar-talking");
    setTimeout(() => avatarImg.classList.remove("avatar-talking"), 400);
  }

  /* Mappa bot → PNG in base al genere */
  function changeAvatar(botName) {
    const gender = localStorage.getItem("player_avatar");
    const map = {
      vendor: gender === "female" ? "donna manager" : "uomo manager",
      influencer: gender === "female" ? "influencer donna" : "influencer uomo",
      professor: gender === "female" ? "professoressa" : "professore",
      newsletter: gender === "female" ? "postina" : "postino",
      generic: gender === "female" ? "donna saggia" : "uomo saggio"
    };
    const file = map[botName] || (gender === "female" ? "donna saggia" : "uomo saggio");
    avatarImg.src = `/videogioco/${file}.png`;
    npcEnter();
  }

  /* Esporta per game.js */
  window.changeAvatar = changeAvatar;

  /* Render sulla LIM: testo o video */
  function renderOnLIM(data) {
    if (!data) return;
    limScreen.innerHTML = "";

    if (data.type === "text" && data.text) {
      const p = document.createElement("p");
      p.innerHTML = clean(data.text);
      limScreen.appendChild(p);
      npcTalk();
      return;
    }

    if (data.type === "video" && data.url) {
      const url = clean(data.url);

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.style.border = "0";
        limScreen.appendChild(iframe);
      } else {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.style.width = "100%";
        video.style.height = "100%";
        limScreen.appendChild(video);
      }
      npcTalk();
      return;
    }

    if (data.fallback) {
      const p = document.createElement("p");
      p.innerHTML = clean(data.fallback);
      limScreen.appendChild(p);
      npcTalk();
    }
  }

  async function apiChat(path, options = {}) {
    try {
      const res = await fetch(path, options);
      const json = await res.json();
      return json.data || json;
    } catch {
      addMessage("❌ Errore rete.");
      return null;
    }
  }

  async function sendTextMessage() {
    const message = clean(chatInput.value);
    if (!message) return;

    addMessage(message, "user");
    chatInput.value = "";

    const bot = localStorage.getItem("active_bot") || "generic";
    const gender = localStorage.getItem("player_avatar") === "female" ? "female" : "male";

    const data = await apiChat("/chat", {
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

  /* Messaggio di benvenuto del saggio alla prima entrata in chat */
  const welcomePending = localStorage.getItem("welcome_sage_pending");
  if (welcomePending === "1") {
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
