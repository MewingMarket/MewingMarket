// =====================
// CHATBOX MewingMarket
// =====================

const launcher = document.getElementById("mm-chat-btn");
const chatbox = document.getElementById("mm-chatbox");
const messages = document.getElementById("mm-chat-messages");
const input = document.querySelector("#mm-chat-input input[type='text']");
const sendBtn = document.querySelector("#mm-chat-input button");

// Toggle chatbox
launcher.addEventListener("click", () => {
  chatbox.style.display = chatbox.style.display === "flex" ? "none" : "flex";
  if (messages.innerHTML.trim() === "") showWelcome();
});

// Funzioni messaggi
function bot(msg) {
  const div = document.createElement("div");
  div.className = "mm-msg mm-bot";
  div.innerHTML = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function user(msg) {
  const div = document.createElement("div");
  div.className = "mm-msg mm-user";
  div.innerHTML = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Messaggio di benvenuto
function showWelcome() {
  bot("👋 Ciao! Posso aiutarti con HERO, supporto o newsletter. Scrivi qui la tua domanda.");
}

// Invio messaggi
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  user(text);
  input.value = "";
  bot("⏳ Sto scrivendo...");

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    const lastBot = messages.querySelector(".mm-msg.mm-bot:last-child");
    if(lastBot) lastBot.remove(); // rimuove "Sto scrivendo..."
    bot(data.reply || "🤖 Ops, non ho capito bene 😅");

  } catch (err) {
    const lastBot = messages.querySelector(".mm-msg.mm-bot:last-child");
    if(lastBot) lastBot.remove();
    bot("❌ Qualcosa è andato storto, riprova più tardi.");
  }
}

// Invia con click
sendBtn.addEventListener("click", sendMessage);
// Invia con Enter
input.addEventListener("keypress", e => { if(e.key === "Enter") sendMessage(); });
