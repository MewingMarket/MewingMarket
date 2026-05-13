/* =========================================================
   GAME ENGINE — UNIVERSAL JSON 2027
   chat.js patchato per SPA + backend 2027
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ELEMENTI BASE */
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatVoice = document.getElementById("chat-voice");
  const chatAttach = document.getElementById("chat-attach");
  const chatFile = document.getElementById("chat-file");
  const avatarImg = document.getElementById("avatar-img");

  /* TOGGLE CHAT ICON */
  const chatToggle = document.getElementById("chat-toggle");
  const chatContainer = document.getElementById("screen-chat");

  if (chatToggle) {
    chatToggle.addEventListener("click", () => {
      goTo("screen-chat");
    });
  }

  /* SANITIZE */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  /* BOLLE */
  function addMessage(text, sender = "bot") {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = clean(text);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /* =========================================================
     RENDER JSON (NUOVO)
  ========================================================== */
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

      case "tutorial_card":
      case "guide":
      case "carousel":
      case "product_card":
      case "product_details":
      case "product_reviews":
        renderCard(data);
        break;

      default:
        addMessage("⚠️ Risposta non riconosciuta.", "bot");
    }
  }

  /* =========================================================
     AVATAR
  ========================================================== */
  function changeAvatar(name) {
    avatarImg.src = `/avatars/${name}.png`;
  }

  /* =========================================================
     QUICK REPLIES
  ========================================================== */
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

  /* =========================================================
     SCROLL AUTOMATICO
  ========================================================== */
  const observer = new MutationObserver(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  });
  observer.observe(chatBox, { childList: true });

  /* =========================================================
     API UNIVERSALE
  ========================================================== */
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

  /* =========================================================
     INVIO TESTO
  ========================================================== */
  async function sendTextMessage() {
    const message = clean(chatInput.value);
    if (!message) return;

    addMessage(message, "user");
    chatInput.value = "";

    const activeBot = localStorage.getItem("active_bot") || "vendor";

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

  chatSend.addEventListener("click", sendTextMessage);

});
