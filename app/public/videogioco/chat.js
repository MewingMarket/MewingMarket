/* =========================================================
   GAME ENGINE — UNIVERSAL JSON 2027
   chat.js patchato per SPA + backend 2027
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatVoice = document.getElementById("chat-voice");
  const chatAttach = document.getElementById("chat-attach");
  const chatFile = document.getElementById("chat-file");
  const avatarImg = document.getElementById("avatar-img");

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  function addMessage(text, sender = "bot") {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = clean(text);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /* AVATAR MAPPING PER BOT */

  function changeAvatar(botName) {
    const gender = localStorage.getItem("player_avatar"); // male/female

    const map = {
      vendor: gender === "female" ? "donna manager" : "uomo manager",
      influencer: gender === "female" ? "influencer donna" : "influencer uomo",
      professor: gender === "female" ? "professoressa" : "professore",
      newsletter: gender === "female" ? "postina" : "postino",
      generic: gender === "female" ? "donna saggia" : "uomo saggio"
    };

    const file = map[botName] || (gender === "female" ? "donna saggia" : "uomo saggio");
    avatarImg.src = `/videogioco/${file}.png`;
  }

  /* RENDER JSON */

  function renderJSON(data) {
    if (!data) return;

    if (data.avatar) changeAvatar(data.avatar);

    switch (data.type) {
      case "text":
        addMessage(data.text, "bot");
        break;

      case "quick_replies":
        renderQuickReplies(data.options);
        break;

      default:
        addMessage("⚠️ Risposta non riconosciuta.", "bot");
    }
  }

  /* QUICK REPLIES */

  function renderQuickReplies(options) {
    const container = document.createElement("div");
    container.className = "quick-replies";

    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "mm-quick";
      btn.dataset.value = opt.intent || opt.value;
      btn.textContent = opt.label;
      container.appendChild(btn);
    });

    chatBox.appendChild(container);
  }

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".mm-quick");
    if (!btn) return;

    chatInput.value = btn.dataset.value;
    chatSend.click();
  });

  /* SCROLL AUTO */

  const observer = new MutationObserver(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  });
  observer.observe(chatBox, { childList: true });

  /* API UNIVERSALE */

  async function apiChat(path, options = {}) {
    let res;
    try {
      res = await fetch(path, options);
    } catch (err) {
      addMessage("❌ Errore rete.");
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch {
      addMessage("❌ Risposta non valida.");
      return null;
    }

    return json.data;
  }

  /* INVIO TESTO */

  async function sendTextMessage() {
    const message = clean(chatInput.value);
    if (!message) return;

    addMessage(message, "user");
    chatInput.value = "";

    const activeBot = localStorage.getItem("active_bot") || "generic";

    const data = await apiChat("/api/chat/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        bot: activeBot
      })
    });

    renderJSON(data);
  }

  if (chatSend) chatSend.addEventListener("click", sendTextMessage);

  /* BENVENUTO DEL SAGGIO DOPO SCELTA AVATAR */

  const welcomePending = localStorage.getItem("welcome_sage_pending");
  if (welcomePending === "1") {
    const gender = localStorage.getItem("player_avatar");
    const npc = gender === "female" ? "donna saggia" : "uomo saggio";
    avatarImg.src = `/videogioco/${npc}.png`;

    addMessage("Benvenuto nel gioco! Io sarò la tua guida.", "bot");
    addMessage("Ora scegli il bot con cui vuoi giocare dalla schermata principale.", "bot");

    localStorage.removeItem("welcome_sage_pending");
  }

});
