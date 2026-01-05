const launcher = document.getElementById("chat-launcher");
const chatbox = document.getElementById("chatbox");
const messages = document.getElementById("chat-messages");
const input = document.getElementById("user-input");
const send = document.getElementById("send-btn");

launcher.onclick = () => {
  chatbox.style.display = chatbox.style.display === "flex" ? "none" : "flex";
  if (messages.innerHTML === "") welcome();
};

function bot(text) {
  messages.innerHTML += `<div class="msg-bot">${text}</div>`;
  messages.scrollTop = messages.scrollHeight;
}

function user(text) {
  messages.innerHTML += `<div class="msg-user">${text}</div>`;
  messages.scrollTop = messages.scrollHeight;
}

function welcome() {
  bot(`👋 Ciao! Posso aiutarti con HERO, supporto o newsletter. Scrivi qui la tua domanda.`);
}

send.onclick = sendMessage;
input.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });

async function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;
  user(msg);
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    bot(data.reply);
  } catch (err) {
    bot("Ops, non riesco a rispondere 😅");
  }
}
