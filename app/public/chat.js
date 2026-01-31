// chat.js — VERSIONE DEFINITIVA (UX PREMIUM + ANDROID14 SAFE + GPT-FIRST)

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mm-chat-btn");
  const box = document.getElementById("mm-chatbox");
  const messages = document.getElementById("mm-chat-messages");
  const input = document.querySelector("#mm-chat-input input");
  const sendBtn = document.querySelector("#mm-chat-input button");

  // Icona PNG
  btn.innerHTML = `<img src="chat-icon.png" alt="Chat" class="mm-chat-icon">`;

  let sending = false;

  // ---------------------------------------------
  // SCROLL MORBIDO
  // ---------------------------------------------
  function smoothScroll() {
    messages.scrollTo({
      top: messages.scrollHeight,
      behavior: "smooth"
    });
  }

  // ---------------------------------------------
  // TYPING REALISTICO
  // ---------------------------------------------
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

  // ---------------------------------------------
  // APRI / CHIUDI CHAT
  // ---------------------------------------------
  btn.addEventListener("click", () => {
    box.classList.toggle("open");

    if (window.TRACKING) {
      window.TRACKING.log("chat_opened", {
        page: window.location.pathname,
        slug: new URLSearchParams(window.location.search).get("slug") || null
      });
    }

    if (!box.dataset.welcomeShown) {
      addBot(`
        👋 <b>Ciao!</b><br>
        Sono il tuo assistente MewingMarket.<br>
        Scrivi <b>menu</b> per vedere le opzioni.
      `);
      box.dataset.welcomeShown = "true";
    }
  });

  // ---------------------------------------------
  // MESSAGGI
  // ---------------------------------------------
  function addUser(text) {
    const div = document.createElement("div");
    div.className = "mm-bubble mm-user";
    div.innerHTML = text;
    messages.appendChild(div);
    smoothScroll();
  }

  function addBot(text) {
    hideTyping();
    const div = document.createElement("div");
    div.className = "mm-bubble mm-bot";
    div.innerHTML = text;
    messages.appendChild(div);
    smoothScroll();
  }

  // ---------------------------------------------
  // QUICK REPLIES INTELLIGENTI
  // ---------------------------------------------
  function addQuickReplies(buttons) {
    const wrap = document.createElement("div");
    wrap.className = "mm-quick-wrap";

    buttons.forEach(label => {
      const b = document.createElement("button");
      b.className = "mm-quick-btn";
      b.textContent = label;

      b.onclick = () => {
        addUser(label);

        if (window.TRACKING) {
          window.TRACKING.log("quick_reply_click", { label });
        }

        sendMessage(label);
        wrap.remove();
      };

      wrap.appendChild(b);
    });

    messages.appendChild(wrap);
    smoothScroll();
  }

  // ---------------------------------------------
  // PRODUCT CARD PREMIUM (BLINDATA)
  // ---------------------------------------------
  function addProductCard(reply) {
    hideTyping();

    const card = document.createElement("div");
    card.className = "mm-product-card";

    const img = reply.match(/https?:\/\/[^\s]+(jpg|jpeg|png|webp|gif|avif)/i);
    const link = reply.match(/https?:\/\/[^\s]*payhip[^\s]*/i);

    card.innerHTML = `
      <img src="${img ? img[0] : "logo.png"}" class="mm-product-img">
      <div class="mm-product-body">${reply}</div>
      ${link ? `<a href="${link[0]}" target="_blank" class="mm-product-btn">Acquista</a>` : ""}
    `;

    if (window.TRACKING) {
      window.TRACKING.log("product_view", { product: reply });
    }

    const buyBtn = card.querySelector(".mm-product-btn");
    if (buyBtn) {
      buyBtn.addEventListener("click", () => {
        if (window.TRACKING) {
          window.TRACKING.log("product_buy_click", { url: buyBtn.href });
        }
      });
    }

    messages.appendChild(card);
    smoothScroll();
  }

  // ---------------------------------------------
  // INVIO MESSAGGIO
  // ---------------------------------------------
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

    if (window.TRACKING) {
      window.TRACKING.log("chat_message_sent", {
        message: text,
        type: forceText ? "quick_reply" : "user"
      });
    }

    showTyping();

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          page: window.location.pathname,
          slug: new URLSearchParams(window.location.search).get("slug") || null
        })
      });

      const data = await res.json();
      let reply = data.reply || "Errore imprevisto.";

      if (window.TRACKING) {
        window.TRACKING.log("chat_message_received", { reply });
      }

      // ---------------------------------------------
      // DETECTION PRODOTTO (BLINDATA)
      // ---------------------------------------------
      if (
        reply.includes("€") &&
        reply.includes("payhip.com") &&
        reply.toLowerCase().includes("acquista")
      ) {
        addProductCard(reply);
        addQuickReplies(["Acquista", "Dettagli", "Menu"]);
        sending = false;
        return;
      }

      // ---------------------------------------------
      // NAVIGAZIONE / MENU
      // ---------------------------------------------
      const low = reply.toLowerCase();
      if (
        low.includes("menu") ||
        low.includes("catalogo") ||
        low.includes("supporto") ||
        low.includes("contatti")
      ) {
        addBot(reply);
        addQuickReplies(["Catalogo", "Supporto", "Contatti", "Menu"]);
        sending = false;
        return;
      }

      // ---------------------------------------------
      // RISPOSTA NORMALE
      // ---------------------------------------------
      addBot(reply);

    } catch (err) {
      hideTyping();
      addBot("⚠️ Problema di connessione. Riprova tra qualche secondo.");

      if (window.TRACKING) {
        window.TRACKING.log("chat_error", { error: err.message });
      }
    }

    sending = false;
  }

  // ---------------------------------------------
  // EVENTI INPUT
  // ---------------------------------------------
  sendBtn.addEventListener("click", () => sendMessage());
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
