
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

    // INTENTI PRINCIPALI
    const intents = {
        menu: ["menu", "inizio", "start", "opzioni", "help", "informazioni"],
        hero: ["hero", "prodotto", "template", "acquistare", "comprare", "prezzo", "include", "funziona", "video hero", "vedere hero", "presentazione"],
        supporto: ["supporto", "aiuto", "problema", "errore", "download", "pagamento", "non funziona", "payhip", "scaricare", "carta", "paypal", "tecnico"],
        newsletter: ["newsletter", "iscrizione", "email", "aggiornamenti", "news"],
        social: ["social", "instagram", "youtube", "tiktok", "x", "twitter", "facebook"],
        fallback: ["non so", "boh", "cosa", "aiuto", "domanda generica", "info"]
    };

    // RISPOSTE BASE
    const replies = {
        menu: "👋 Ciao! Sono qui per aiutarti con HERO, supporto, newsletter, social e altro. Digita 'menu' per iniziare.",
        newsletter: `✉️ Vuoi iscriverti alla newsletter?<br>Riceverai contenuti utili e aggiornamenti.<br><a href="https://mewingmarket.payhip.com/newsletter" target="_blank">Iscriviti ora</a>`,
        fallback: "🤖 Non ho capito bene. Digita 'menu' per vedere le opzioni disponibili."
    };

    // SOTTO-INTENTI
    const isDownloadIssue = text.includes("download") || text.includes("scaricare") || text.includes("non scarica");
    const isPaymentIssue = text.includes("pagamento") || text.includes("carta") || text.includes("paypal") || text.includes("transazione");
    const isTechnicalIssue = text.includes("errore") || text.includes("bug") || text.includes("tecnico") || text.includes("non funziona");
    const isSupportImpossible = text.includes("non riesco") || text.includes("non risolto") || text.includes("non aiuta") || text.includes("non funziona la chat");

    const isHeroIntent = intents.hero.some(k => text.includes(k));
    const isVideoRequest = text.includes("video") || text.includes("vedere") || text.includes("presentazione");
    const isPurchaseRequest = text.includes("acquista") || text.includes("comprare") || text.includes("prezzo");

    const socialLinks = {
        instagram: `<a href="https://www.instagram.com/mewingmarket" target="_blank">Instagram</a>`,
        tiktok: `<a href="https://tiktok.com/@mewingmarket" target="_blank">TikTok</a>`,
        youtube: `<a href="https://www.youtube.com/@mewingmarket2" target="_blank">YouTube</a>`,
        x: `<a href="https://x.com/mewingm8" target="_blank">X / Twitter</a>`,
        facebook: `<a href="https://www.facebook.com/profile.php?id=61584779793628" target="_blank">Facebook</a>`
    };

    // CALCOLO INTENTO PRINCIPALE
    let bestIntent = null;
    let maxScore = 0;

    for (const [intent, keywords] of Object.entries(intents)) {
        const score = keywords.filter(k => text.includes(k)).length;
        if (score > maxScore) {
            maxScore = score;
            bestIntent = intent;
        }
    }

    // RISPOSTA
    let reply;

    if (bestIntent === "supporto") {
        if (isDownloadIssue) {
            reply = "📥 Ok, ti aiuto con il download:\n\n1️⃣ Controlla l’email di acquisto (anche in spam).\n2️⃣ Assicurati di essere loggato su Payhip con la stessa email.\n3️⃣ Prova da un altro browser o dispositivo.\n\nSe non funziona, scrivimi su WhatsApp: <b>+39 351 999 8742</b> o via email: <b>support@mewingmarket.it</b>";
        } else if (isPaymentIssue) {
            reply = "💳 Problema con il pagamento:\n\n1️⃣ Verifica che la carta sia abilitata ai pagamenti online.\n2️⃣ Prova PayPal se disponibile.\n3️⃣ Controlla se la banca ha bloccato l’operazione.\n\nSe non riesci, contattaci su WhatsApp: <b>+39 351 999 8742</b> o email: <b>support@mewingmarket.it</b>";
        } else if (isTechnicalIssue) {
            reply = "🛠 Problema tecnico:\n\n1️⃣ Aggiorna la pagina.\n2️⃣ Cancella cache e cookie.\n3️⃣ Prova da un altro dispositivo.\n\nSe persiste, scrivici su WhatsApp: <b>+39 351 999 8742</b> o email: <b>support@mewingmarket.it</b>";
        } else if (isSupportImpossible) {
            reply = "📞 Sembra che la chat non basti.\nContattaci direttamente:\n\nWhatsApp: <b>+39 351 999 8742</b>\nEmail: <b>support@mewingmarket.it</b>";
        } else {
            reply = "💬 Scegli il tipo di supporto: download, pagamento o tecnico.";
        }
    } else if (bestIntent === "hero") {
        if (isVideoRequest) {
            reply = `🎥 Ecco il video di HERO:<br><a href="https://mewingmarket.payhip.com/b/hero-video" target="_blank">Guarda ora</a><br>Vuoi acquistarlo? Scrivi “acquista HERO”`;
        } else if (isPurchaseRequest) {
            reply = `🛒 Puoi acquistare HERO da qui:<br><a href="https://mewingmarket.payhip.com/b/hero" target="_blank">Acquista HERO</a>`;
        } else {
            reply = "🔥 HERO è il nostro prodotto digitale più richiesto. Include template pronti, struttura guidata e accesso immediato.\nScrivi “video HERO” per vedere l’anteprima o “acquista HERO” per comprarlo.";
        }
    } else if (bestIntent === "social") {
        const foundSocial = Object.entries(socialLinks).filter(([key]) => text.includes(key));
        if (foundSocial.length > 0) {
            reply = `📲 Ecco il link richiesto:<br>${foundSocial.map(([_, link]) => link).join("<br>")}`;
        } else {
            reply = `📲 Ecco tutti i nostri social:<br>${Object.values(socialLinks).join("<br>")}`;
        }
    } else if (bestIntent && replies[bestIntent]) {
        reply = replies[bestIntent];
    } else {
        reply = replies.fallback;
    }

    res.json({ reply });
});

app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server attivo su porta ${PORT}`));
