import express from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Serve i file statici nella cartella public
app.use(express.static(path.join(process.cwd(), "public")));

// Endpoint POST /chat per chat AI Livello 1
app.post("/chat", (req, res) => {
    const { message } = req.body;
    if (!message || message.trim() === "") {
        return res.status(400).json({ reply: "❌ Messaggio vuoto, scrivi qualcosa." });
    }

    const text = message.toLowerCase();

    // Albero conversazione Livello 1
    const responses = [
        { triggers: ["menu","inizio","start","opzioni","help","informazioni"], reply: "Ciao! 👋 Sono qui per aiutarti con HERO, supporto, newsletter e altro. Scegli un’opzione." },
        { triggers: ["hero","prodotto","comprare hero","acquistare","prezzo hero","cosa include hero","template"], reply: "🔥 HERO è il nostro prodotto digitale più richiesto. Include template pronti, struttura guidata e accesso immediato. Vuoi vedere il video o acquistarlo?" },
        { triggers: ["video hero","vedere hero","anteprima","presentazione"], reply: "Ecco il video di presentazione di HERO 🎥. Vuoi acquistarlo o tornare al menu?" },
        { triggers: ["supporto","assistenza","problema","errore","download non funziona","payhip"], reply: "Sono qui per aiutarti 💬. Scegli il tipo di supporto: download, pagamento o tecnico." },
        { triggers: ["newsletter","iscrizione","email","aggiornamenti","news"], reply: "Vuoi iscriverti alla newsletter? Riceverai contenuti utili e aggiornamenti." },
        { triggers: ["social","instagram","tiktok","youtube","profili social"], reply: "Ecco i nostri social ufficiali 📲. Scegli quello che vuoi visitare:" },
        { triggers: ["non so","boh","cosa","aiuto","domanda generica","info"], reply: "Non ho capito bene la tua richiesta, ma posso aiutarti! Vuoi tornare al menu?" }
    ];

    let found = false;
    for (const r of responses) {
        if (r.triggers.some(t => text.includes(t))) {
            res.json({ reply: r.reply });
            found = true;
            break;
        }
    }
    if (!found) {
        res.json({ reply: `🤖 Non ho capito bene. Vuoi tornare al menu?` });
    }
});

// Tutte le richieste GET servono index.html (supporta SPA o multipagina)
app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server attivo su porta ${PORT}`));
