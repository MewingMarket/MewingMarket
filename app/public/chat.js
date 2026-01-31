// chat.js — VERSIONE MAX (blindato + UX premium)

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mm-chat-btn");
  const box = document.getElementById("mm-chatbox");
  const messages = document.getElementById("mm-chat-messages");
  const input = document.querySelector("#mm-chat-input input");
  const sendBtn = document.querySelector("#mm-chat-input button");

  // Inserisci icona PNG nel bottone
  btn.innerHTML = `<img src="chat-icon.png" alt="Chat" class="mm-chat-icon">`;

  // Stato invio (evita doppi invii)
  let sending = false;

  // Typing indicator
  function showTyping() {
    const div = document.createElement("div");
    div.className = "mm-bubble mm-bot mm-typing";
    div.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    const typing = document.querySelector(".mm-typing");
    if (typing) typing.remove();
  }

  // Apri/chiudi chat
  btn.addEventListener("click", () => {
    box.classList.toggle("open");

    if (!box.dataset.welcomeShown) {
      addBot(`
        👋 <b>Ciao!</b><br>
        Sono il tuo assistente MewingMarket.<br>
        Scrivi <b>menu</b> per vedere le opzioni.
      `);
      box.dataset.welcomeShown = "true";
    }
  });

  // Aggiunge messaggio utente
  function addUser(text) {
    const div = document.createElement("div");
    div.className = "mm-bubble mm-user";
    div.innerHTML = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // Aggiunge messaggio bot
  function addBot(text) {
    hideTyping();
    const div = document.createElement("div");
    div.className = "mm-bubble mm-bot";
    div.innerHTML = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // Quick replies
  function addQuickReplies(buttons) {
    const wrap = document.createElement("div");
    wrap.className = "mm-quick-wrap";

    buttons.forEach(b => {
      const btn = document.createElement("button");
      btn.className = "mm-quick-btn";
      btn.textContent = b;
      btn.onclick = () => {
        addUser(b);
        sendMessage(b);
        wrap.remove();
      };
      wrap.appendChild(btn);
    });

    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  // Product card premium
  function addProductCard(reply) {
    hideTyping();

    const card = document.createElement("div");
    card.className = "mm-product-card";

    const img = reply.match(/https?:\/\/[^\s]+(jpg|png|jpeg|webp)/i);
    const link = reply.match(/https?:\/\/[^\s]+payhip[^\s]*/i);

    card.innerHTML = `
      <img src="${img ? img[0] : "logo.png"}" class="mm-product-img">
      <div class="mm-product-body">
        ${reply}
      </div>
      ${link ? `<a href="${link[0]}" target="_blank" class="mm-product-btn">Acquista</a>` : ""}
    `;

    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  // Invio messaggio
  async function sendMessage(forceText = null) {
    if (sending) return; // evita spam
    sending = true;

    const text = forceText || input.value.trim();
    if (!text) {
      sending = false;
      return;
    }

    addUser(text);
    input.value = "";

    showTyping();

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text,

          // 🔥 Contesto pagina
          page: window.location.pathname,

          // 🔥 Contesto slug prodotto
          slug: new URLSearchParams(window.location.search).get("slug") || null
        })
      });

      const data = await res.json();
      const reply = data.reply || "Errore imprevisto.";

      // Risposta commerciale
      if (reply.includes("€") || reply.includes("payhip.com")) {
        addProductCard(reply);
        addQuickReplies(["Acquista", "Dettagli", "Menu"]);
        sending = false;
        return;
      }

      // Navigazione / menu
      const low = reply.toLowerCase();
      if (
        low.includes("menu") ||
        low.includes("catalogo") ||
        low.includes("supporto")
      ) {
        addBot(reply);
        addQuickReplies(["Catalogo", "Supporto", "Contatti", "Menu"]);
        sending = false;
        return;
      }

      // Risposta diretta
      addBot(reply);

    } catch (err) {
      hideTyping();
      addBot("⚠️ Problema di connessione. Riprova tra qualche secondo.");
    }

    sending = false;
  }

  // Eventi input
  sendBtn.addEventListener("click", () => sendMessage());
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
