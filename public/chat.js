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

        const reply = aiResponses(data.message.toLowerCase());
        bot(reply);

    } catch (err) {
        console.error("CHAT ERROR:", err);
        const lastBot = messages.querySelector(".mm-msg.mm-bot:last-child");
        if (lastBot) lastBot.remove();
        bot("❌ Il servizio chat non è attivo. Scrivici via email a supporto@mewingmarket.it");
    }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => { if(e.key === "Enter") sendMessage(); });

// ==================
// Funzione AI simulata
// ==================
function aiResponses(text) {
    const mapping = [
        { triggers: ["menu","inizio","start","opzioni","help","informazioni"], reply: "Ciao! 👋 Sono qui per aiutarti con HERO, supporto, newsletter e altro. Scegli un’opzione." },
        { triggers: ["hero","prodotto","comprare hero","acquistare","prezzo hero","cosa include hero","template"], reply: "🔥 HERO è il nostro prodotto digitale più richiesto. Include template pronti, struttura guidata e accesso immediato. Vuoi vedere il video o acquistarlo?" },
        { triggers: ["video hero","vedere hero","anteprima","presentazione"], reply: `Ecco il video di presentazione di HERO 🎥<br>
Vuoi acquistarlo o tornare al menu?<br>
👉 <a href="https://mewingmarket.payhip.com/b/hero" target="_blank">Acquista HERO</a>` },
        { triggers: ["supporto","assistenza","problema","errore","download non funziona","payhip"], reply: "Sono qui per aiutarti 💬 Scegli il tipo di supporto: problemi di download, pagamento o tecnico." },
        { triggers: ["newsletter","iscrizione","email","aggiornamenti","news"], reply: `Vuoi iscriverti alla newsletter? ✉️<br>
Riceverai contenuti utili e aggiornamenti.<br>
Puoi iscriverti dalla chat, dalle pagine del sito o tramite i link nei nostri contenuti.` },
        { triggers: ["social","instagram","tiktok","youtube","profili social"], reply: `Ecco i nostri social ufficiali 📲:<br>
- <a href="https://www.instagram.com/mewingmarket" target="_blank">Instagram</a><br>
- <a href="https://tiktok.com/@mewingmarket" target="_blank">TikTok</a><br>
- <a href="https://www.youtube.com/@mewingmarket2" target="_blank">YouTube</a><br>
- <a href="https://x.com/mewingm8" target="_blank">X/Twitter</a>` },
        { triggers: ["payhip","download","problemi"], reply: `📦 Payhip gestisce pagamenti e download.<br>
- Dopo il pagamento ricevi subito l'email con il link.<br>
- Se non funziona controlla spam/promozioni.<br>
- Se ancora non funziona, contattaci in chat.` },
        { triggers: ["non so","boh","cosa","aiuto","domanda generica","info"], reply: "Non ho capito bene la tua richiesta, ma posso aiutarti! Vuoi tornare al menu?" }
    ];

    for (const r of mapping) {
        if (r.triggers.some(t => text.includes(t))) return r.reply;
    }
    return "🤖 Non ho capito bene. Digita 'menu' per vedere le opzioni disponibili.";
}
