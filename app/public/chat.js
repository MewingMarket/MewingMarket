// chat.js — VERSIONE DEFINITIVA (UX PREMIUM + ANDROID14 SAFE + GPT-FIRST)

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mm-chat-btn");
  const box = document.getElementById("mm-chatbox");
  const messages = document.getElementById("mm-chat-messages");
  const input = document.querySelector("#mm-chat-input input[type='text']");
  const sendBtn = document.querySelector("#mm-chat-input button:not(#mm-attach)");

  btn.innerHTML = `<img src="chat-icon.png" alt="Chat" class="mm-chat-icon">`;

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

  function addQuickReplies(buttons) {
    const wrap = document.createElement("div");
    wrap.className = "mm-quick-wrap";

    buttons.forEach(label => {
      const b = document.createElement("button");
      b.className = "mm-quick-btn";
      b.textContent = label;

      b.onclick = () => {
        addUser(label);
        sendMessage(label);
        wrap.remove();
      };

      wrap.appendChild(b);
    });

    messages.appendChild(wrap);
    smoothScroll();
  }

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

    messages.appendChild(card);
    smoothScroll();
  }

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

      const low = reply.toLowerCase();

      if (
        reply.includes("€") &&
        reply.includes("payhip.com") &&
        low.includes("acquista")
      ) {
        addProductCard(reply);
        addQuickReplies(["Acquista", "Dettagli", "Menu"]);
        sending = false;
        return;
      }

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

      addBot(reply);

    } catch (err) {
      hideTyping();
      addBot("⚠️ Problema di connessione. Riprova tra qualche secondo.");
    }

    sending = false;
  }

  // --- Upload allegati (VERSIONE CORRETTA) ---
  const attachBtn = document.getElementById("mm-attach");
  const fileInput = document.getElementById("mm-file-input");

  if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      addUser("📎 File inviato: " + file.name);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/chat/upload", {
          method: "POST",
          body: formData
        });

        const data = await res.json();

        if (data.fileUrl) {
          sendMessage("FILE:" + data.fileUrl);
        } else {
          addBot("Errore durante l'upload del file.");
        }
      } catch (err) {
        addBot("Errore di connessione durante l'upload.");
      }

      fileInput.value = "";
    });
  }

  sendBtn.addEventListener("click", () => sendMessage());
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
