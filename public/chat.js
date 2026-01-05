// ======= CHAT.JS COMPLETO =======

// Elementi DOM
const launcher = document.getElementById("chat-launcher"); // bottone apertura chat
const chatbox = document.getElementById("chatbox");        // contenitore chat
const messages = document.getElementById("chat-messages"); // area messaggi
const input = document.getElementById("user-input");       // input testo utente
const send = document.getElementById("send-btn");          // bottone invio

// Apri/chiudi chat
launcher.onclick = () => {
    chatbox.style.display = chatbox.style.display === "flex" ? "none" : "flex";
    if (messages.innerHTML === "") welcome(); // messaggio iniziale solo la prima volta
};

// Funzione messaggio bot
function bot(text) {
    messages.innerHTML += `<div class="mm-msg mm-bot">${text}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

// Funzione messaggio utente
function user(text) {
    messages.innerHTML += `<div class="mm-msg mm-user">${text}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

// Messaggio di benvenuto
function welcome() {
    bot("👋 Ciao! Posso aiutarti con HERO, supporto download, prezzi o newsletter. Scrivi qui la tua domanda.");
}

// Invio messaggio con bottone o invio tastiera
send.onclick = sendMessage;
input.addEventListener("keypress", e => { if(e.key === "Enter") sendMessage(); });

// Funzione principale invio messaggio
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
        console.error(err);
        bot("⚠️ Ops, non riesco a rispondere. Riprova tra qualche istante.");
    }
}
