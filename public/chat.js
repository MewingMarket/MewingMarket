const launcher = document.getElementById("mm-chat-btn");
const chatbox = document.getElementById("mm-chatbox");
const messages = document.getElementById("mm-chat-messages");
const input = chatbox.querySelector("input[type='text']");
const sendBtn = chatbox.querySelector("button");

launcher.addEventListener("click", () => {
    chatbox.style.display = chatbox.style.display === "flex" ? "none" : "flex";
    if (messages.innerHTML.trim() === "") showWelcome();
});

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

function showWelcome() {
    bot("👋 Ciao! Sono qui per aiutarti con HERO, supporto, newsletter, social e altro. Digita 'menu' per iniziare.");
}

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

        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        const lastBot = messages.querySelector(".mm-msg.mm-bot:last-child");
        if (lastBot) lastBot.remove();

        bot(data.reply ?? "🤖 Nessuna risposta disponibile al momento.");

    } catch (err) {
        console.error("CHAT ERROR:", err);
        const lastBot = messages.querySelector(".mm-msg.mm-bot:last-child");
        if (lastBot) lastBot.remove();
        bot("❌ Il servizio chat non è attivo. Scrivici via email a supporto@mewingmarket.it");
    }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => { if(e.key === "Enter") sendMessage(); });
