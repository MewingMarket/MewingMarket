
import express from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors({ origin: ["https://mewingmarket.it", "https://www.mewingmarket.it"] }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.post("/chat", (req, res) => {
    const { message } = req.body;
    if (!message || message.trim() === "") {
        return res.status(400).json({ reply: "❌ Messaggio vuoto, scrivi qualcosa." });
    }

    const text = message.toLowerCase();

    const intents = {
        menu: ["menu", "inizio", "start", "opzioni", "help", "informazioni"],
        hero: ["hero", "prodotto", "template", "acquistare", "comprare", "prezzo", "include", "funziona"],
        video: ["video", "vedere", "presentazione", "anteprima"],
        supporto: ["supporto", "aiuto", "problema", "errore", "download", "pagamento", "non funziona", "payhip"],
        newsletter: ["newsletter", "iscrizione", "email", "aggiornamenti", "news"],
        social: ["social", "instagram", "youtube", "tiktok", "x", "twitter"],
        fallback: ["non so", "boh", "cosa", "aiuto", "domanda generica", "info"]
    };

    const replies = {
        menu: "Ciao! 👋 Sono qui per aiutarti con HERO, supporto, newsletter e altro. Scegli un’opzione.",
        hero: "🔥 HERO è il nostro prodotto digitale più richiesto. Include template pronti, struttura guidata e accesso immediato. Vuoi vedere il video o acquistarlo?",
        video: `🎥 Ecco il video di HERO:<br><a href="https://mewingmarket.payhip.com/b/hero" target="_blank">Guarda ora</a>`,
        supporto: "Sono qui per aiutarti 💬 Scegli il tipo di supporto: download, pagamento o tecnico.",
        newsletter: `Vuoi iscriverti alla newsletter? ✉️ Riceverai contenuti utili e aggiornamenti.<br><a href="https://mewingmarket.payhip.com/newsletter" target="_blank">Iscriviti ora</a>`,
        social: `Ecco i nostri social ufficiali 📲:<br>
- <a href="https://www.instagram.com/mewingmarket" target="_blank">Instagram</a><br>
- <a href="https://tiktok.com/@mewingmarket" target="_blank">TikTok</a><br>
- <a href="https://www.youtube.com/@mewingmarket2" target="_blank">YouTube</a><br>
- <a href="https://x.com/mewingm8" target="_blank">X/Twitter</a>`,
        fallback: "Non ho capito bene la tua richiesta, ma posso aiutarti! Vuoi tornare al menu?"
    };

    let bestIntent = null;
    let maxScore = 0;

    for (const [intent, keywords] of Object.entries(intents)) {
        const score = keywords.filter(k => text.includes(k)).length;
        if (score > maxScore) {
            maxScore = score;
            bestIntent = intent;
        }
    }

    const reply = replies[bestIntent] || "🤖 Non ho capito bene. Digita 'menu' per vedere le opzioni disponibili.";
    res.json({ reply });
});

app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server attivo su porta ${PORT}`));
