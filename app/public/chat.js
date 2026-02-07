

// ======================================================
// DEBUG MODE (puoi rimuovere l’alert se ti dà fastidio)
// ======================================================

console.log("🔥 chat.js caricato");

// Intercetta errori globali
window.onerror = function(msg, url, line, col, error) {
  console.error("❌ ERRORE GLOBALE:", msg, url, line, col, error);
};

// Intercetta promise non gestite
window.addEventListener("unhandledrejection", function(e) {
  console.error("❌ PROMISE NON GESTITA:", e.reason);
});

// ======================================================
// CHATBOT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("📌 DOM completamente caricato");

  const btn = document.getElementById("mm-chat-btn");
  const box = document.getElementById("mm-chatbox");
  const messages = document.getElementById("mm-chat-messages");
  const input = document.querySelector("#mm-chat-input input[type='text']");
  const sendBtn = document.querySelector("#mm-chat-input button:not(#mm-attach)");

  console.log("📌 Elementi trovati:", { btn, box, messages, input, sendBtn });

  let sending = false;

  function smoothScroll() {
    messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
  }

  function showTyping() {
    hideTyping();
    const div = document.createElement("div");
    div.className = "mm-bubble mm-bot mm-typing";
    div.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    messages.appendChild(div);
    smoothScroll();
  }

  function hideTyping() {
    const t = document.querySelector(".mm-typing");
    if (t) t.remove();
  }

  btn.addEventListener("click", () => {
    console.log("🟢 Chat aperta");
    box.classList.toggle("open");

    if (!box.dataset.welcomeShown) {
      addBot("👋 Ciao! Scrivi 'menu' per iniziare.");
      box.dataset.welcomeShown = "true";
    }
  });

  function addUser(text) {
    console.log("👤 Utente:", text);
    const div = document.createElement("div");
    div.className = "mm-bubble mm-user";
    div.innerHTML = text;
    messages.appendChild(div);
    smoothScroll();
  }

  function addBot(text) {
    console.log("🤖 Bot:", text);
    hideTyping();
    const div = document.createElement("div");
    div.className = "mm-bubble mm-bot";
    div.innerHTML = text;
    messages.appendChild(div);
    smoothScroll();
  }

  // ======================================================
  // FUNZIONE PRINCIPALE DI INVIO MESSAGGI
  // ======================================================
  async function sendMessage(forceText = null) {
    if (sending) return;
    sending = true;

    const text = forceText || input.value.trim();
    if (!text) {
      sending = false;
      return;
    }

    addUser(text);
    input.value = "";

    showTyping();

    // 🔥 ENDPOINT CORRETTO
    const endpoint = "/chat";

    console.log("📡 FETCH →", endpoint);
    console.log("📨 BODY →", {
      message: text,
      page: window.location.pathname,
      slug: new URLSearchParams(window.location.search).get("slug") || null
    });

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          page: window.location.pathname,
          slug: new URLSearchParams(window.location.search).get("slug") || null
        })
      });

      console.log("📥 RISPOSTA RAW:", res);

      const data = await res.json().catch(err => {
        console.error("❌ ERRORE PARSING JSON:", err);
        throw new Error("JSON non valido");
      });

      console.log("📥 RISPOSTA JSON:", data);

      addBot(data.reply || "Errore imprevisto.");

    } catch (err) {
      console.error("❌ ERRORE FETCH:", err);
      hideTyping();
      addBot("⚠️ Problema di connessione. Riprova tra qualche secondo.");
    }

    sending = false;
  }

  // ======================================================
  // EVENTI INVIO
  // ======================================================
  sendBtn.addEventListener("click", () => sendMessage());

  input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
