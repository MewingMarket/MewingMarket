// ===============================
// FUNZIONI UTILI
// ===============================

// Recupera cookie (il server crea mm_uid)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Aggiunge un messaggio alla chat
function addMessage(text, sender = "bot") {
  const box = document.getElementById("mm-chat-messages");
  const bubble = document.createElement("div");
  bubble.classList.add("mm-bubble", sender === "bot" ? "mm-bot" : "mm-user");
  bubble.innerHTML = text;
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
}

// ===============================
// CHATBOX APERTURA/CHIUSURA
// ===============================
const chatBtn = document.getElementById("mm-chat-btn");
const chatBox = document.getElementById("mm-chatbox");

chatBtn.addEventListener("click", () => {
  chatBox.classList.toggle("open");

  // Mostra messaggio di benvenuto solo la prima volta
  if (!chatBox.dataset.welcomeShown) {
    addMessage(
      "<b>👋 Ciao!</b><br>Sono qui per aiutarti con la *Guida Completa all’Ecosistema Digitale Reale*, gli altri prodotti, il supporto, la newsletter e molto altro.<br><br>Scrivi pure la tua domanda oppure digita <b>menu</b> per vedere le opzioni.",
      "bot"
    );
    chatBox.dataset.welcomeShown = "true";
  }
});

// ===============================
// INVIO MESSAGGI
// ===============================
const input = document.getElementById("mm-text");
const sendBtn = document.getElementById("mm-send");

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  // Mostra messaggio utente
  addMessage(message, "user");
  input.value = "";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (data && data.reply) {
      addMessage(data.reply, "bot");
    } else {
      addMessage("⚠️ Errore imprevisto. Riprova tra poco.", "bot");
    }
  } catch (err) {
    addMessage("⚠️ Problema di connessione. Controlla la rete.", "bot");
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});
