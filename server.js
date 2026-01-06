
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();

// =========================
// CONFIGURAZIONE BASE
// =========================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

// =========================
// MEMORIA RAM PER UTENTI
// =========================
const userStates = {}; 
// struttura: { mm_uid: { state: "menu", lastIntent: null, data: {} } }

// =========================
// GENERATORE ID UTENTE
// =========================
function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

// =========================
// MIDDLEWARE COOKIE + STATO
// =========================
app.use((req, res, next) => {
  let uid = req.cookies.mm_uid;

  if (!uid) {
    uid = generateUID();
    res.cookie("mm_uid", uid, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 30
    });
  }

  if (!userStates[uid]) {
    userStates[uid] = {
      state: "menu",
      lastIntent: null,
      data: {}
    };
  }

  req.uid = uid;
  req.userState = userStates[uid];
  next();
});

// =========================
// FUNZIONI DI SUPPORTO
// =========================
function setState(uid, newState) {
  userStates[uid].state = newState;
}

function reply(res, text) {
  res.json({ reply: text });
}

// =========================
// INTENT MATCHER ULTRA
// =========================
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // rimuove accenti
    .replace(/[^a-z0-9àèéìòóùç\s]/gi, " ") // toglie punteggiatura
    .replace(/\s+/g, " ")
    .trim();
}

function detectIntent(rawText) {
  const t = normalizeText(rawText);

  // Se menziona chiaramente social, forziamo subito "social"
  if (
    t.includes("instagram") ||
    t.includes("tik tok") ||
    t.includes("tiktok") ||
    t.includes("you tube") ||
    t.includes("youtube") ||
    t.includes("facebook") ||
    t.includes("meta") ||
    t.includes("thread") ||
    t.includes("linkedin") ||
    t === "x" ||
    t.includes("twitter") ||
    t.includes("social")
  ) {
    return "social";
  }

  const intents = {
    hero: {
      baseScore: 2,
      keywords: [
        "hero",
        "guida completa",
        "ecosistema digitale",
        "prodotto digitale",
        "direttore operativo",
        "guida hero",
        "ecosistema reale",
        "mewingmarket hero"
      ]
    },
    video: {
      baseScore: 1,
      keywords: [
        "video",
        "presentazione",
        "video hero",
        "anteprima",
        "video di hero",
        "guarda il video"
      ]
    },
    acquisto: {
      baseScore: 2,
      keywords: [
        "acquista",
        "acquisto",
        "comprare",
        "compra",
        "prendere",
        "voglio hero",
        "comprare hero",
        "compra hero",
        "prezzo",
        "costo",
        "costa",
        "quanto costa",
        "pagare",
        "pago",
        "pagamento",
        "come pago",
        "pagare hero",
        "link acquisto",
        "checkout"
      ]
    },
    supporto: {
      baseScore: 1,
      keywords: [
        "supporto",
        "assistenza",
        "aiuto",
        "problema",
        "errore",
        "non funziona",
        "download",
        "scaricare",
        "file",
        "pagamento fallito",
        "paypal",
        "carta",
        "rimborso",
        "refund",
        "supporto tecnico"
      ]
    },
    newsletter: {
      baseScore: 1,
      keywords: [
        "newsletter",
        "iscrizione",
        "iscrivermi",
        "iscriviti",
        "email",
        "aggiornamenti",
        "novita",
        "disiscrizione",
        "disiscrivermi",
        "annulla iscrizione",
        "cancellami",
        "togli newsletter"
      ]
    },
    sito: {
      baseScore: 1,
      keywords: [
        "sito",
        "sito web",
        "website",
        "pagina",
        "home",
        "home page",
        "mewingmarket it",
        "mewing market it",
        "vai al sito"
      ]
    },
    fallback: {
      baseScore: 0,
      keywords: [
        "info",
        "informazioni",
        "non so",
        "boh",
        "spiegami",
        "cosa fai",
        "chi sei",
        "aiuto generico"
      ]
    }
  };

  // punteggio per ogni intent
  let bestIntent = "fallback";
  let bestScore = 0;

  for (const [intent, cfg] of Object.entries(intents)) {
    let score = cfg.baseScore;

    for (const k of cfg.keywords) {
      if (t.includes(k)) {
        score += 2; // ogni match pesa
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestIntent || "fallback";
}
// =========================
// ROUTER PRINCIPALE
// =========================
app.post("/chat", (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    return reply(res, "Scrivi un messaggio così posso aiutarti.");
  }

  const uid = req.uid;
  const state = req.userState.state;
  const intent = detectIntent(message);

  // RESET AUTOMATICO STATO (evita loop)
  if (intent !== state) {
    setState(uid, intent);
  }

  // Passo alla Parte 2 (blocchi conversazionali)
  return handleConversation(req, res, intent, message.toLowerCase());
});// =========================
// LINK UFFICIALI (CTA + link sotto)
// =========================
const LINKS = {
  instagram: `👉 Vai su Instagram  
https://www.instagram.com/mewingmarket?igsh=eGZ2MHE0bTFtbmJt`,

  tiktok: `👉 Vai su TikTok  
https://tiktok.com/@mewingmarket`,

  youtube: `👉 Vai su YouTube  
https://www.youtube.com/@mewingmarket2`,

  facebook: `👉 Vai su Facebook  
https://www.facebook.com/profile.php?id=61584779793628`,

  x: `👉 Vai su X  
https://x.com/mewingm8`,

  threads: `👉 Vai su Threads  
https://www.threads.net/@mewingmarket`,

  linkedin: `👉 Vai su LinkedIn  
https://www.linkedin.com/in/simone-griseri-5368a7394?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app`,

  sito: `👉 Vai al sito  
https://www.mewingmarket.it`,

  store: `👉 Vai allo store  
https://payhip.com/MewingMarket`,

  hero: `👉 Acquista HERO  
https://payhip.com/b/LhqQT`,

  video: `👉 Guarda il video di HERO  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared`,

  newsletter: `👉 Iscriviti alla newsletter  
https://mewingmarket.it/iscrizione.html`,

  disiscrizione: `👉 Annulla iscrizione newsletter  
https://mewingmarket.it/disiscriviti.html`
};

// =========================
// BLOCCHI RISPOSTA
// =========================
const BLOCKS = {
  hero: `
🔥 HERO è il tuo direttore operativo digitale: ti mostra come funziona davvero un ecosistema di prodotti digitali nel 2025, senza scorciatoie e senza fuffa.

All'interno trovi:
- La storia dell'IA: dai miti antichi a ChatGPT, Copilot e Gemini
- Cosa è davvero un prodotto digitale (e cosa non è)
- Analisi di mercato e competitor
- Guida completa agli strumenti chiave (IA, Notion, Canva, Metricool, GA4 + Perplexity, Make, Payhip, Shopify, Gumroad, sito, DNS, hosting, automazioni, marketing reale, costi e tempi veri)
- Come evitare la fuffa e costruire qualcosa di solido

In più hai:
- Mini‑corso video
- Checklist operativa in PDF
- File ZIP unico

Se vuoi procedere:
${LINKS.hero}
`,

  video: `
🎥 Video di presentazione di HERO

In questo video ti mostriamo la logica dell’ecosistema digitale, gli strumenti fondamentali e i passaggi reali per partire.

${LINKS.video}

Se dopo il video vuoi acquistare HERO:
${LINKS.hero}
`,

  acquisto: `
Perfetto! Puoi acquistare HERO direttamente qui:

${LINKS.hero}

Se vuoi prima vedere il video introduttivo:
${LINKS.video}
`,

  supporto: `
🛠️ Supporto tecnico MewingMarket

Se hai problemi con download, pagamenti, email o file, posso aiutarti.

Oppure puoi visitare lo store:
${LINKS.store}

Ecco anche il sito:
${LINKS.sito}
`,

  newsletter: `
✉️ Newsletter MewingMarket

Iscriviti qui:
${LINKS.newsletter}

Se vuoi annullare l’iscrizione:
${LINKS.disiscrizione}
`,

  sito: `
Ecco il sito ufficiale:

${LINKS.sito}

E qui lo store:
${LINKS.store}
`,

  socialMenu: `
🌐 Social MewingMarket

${LINKS.instagram}

${LINKS.tiktok}

${LINKS.youtube}

${LINKS.facebook}

${LINKS.x}

${LINKS.threads}

${LINKS.linkedin}
`
};

// =========================
// PRIORITÀ SOCIAL (match diretto)
// =========================
function handleSocial(text, res, uid) {
  if (text.includes("instagram")) return reply(res, LINKS.instagram);
  if (text.includes("tiktok")) return reply(res, LINKS.tiktok);
  if (text.includes("youtube")) return reply(res, LINKS.youtube);
  if (text.includes("facebook")) return reply(res, LINKS.facebook);
  if (text.includes("threads")) return reply(res, LINKS.threads);
  if (text.includes("linkedin")) return reply(res, LINKS.linkedin);
  if (text.includes("x") || text.includes("twitter")) return reply(res, LINKS.x);

  return reply(res, BLOCKS.socialMenu);
}// =========================
// GESTIONE CONVERSAZIONE
// =========================
function handleConversation(req, res, intent, text) {
  const uid = req.uid;

  // PRIORITÀ SOCIAL
  if (intent === "social") {
    return handleSocial(text, res, uid);
  }

  // ROUTING PRINCIPALE
  switch (intent) {
    case "hero":
      return reply(res, BLOCKS.hero);

    case "video":
      return reply(res, BLOCKS.video);

    case "acquisto":
      return reply(res, BLOCKS.acquisto);

    case "supporto":
      return reply(res, BLOCKS.supporto);

    case "newsletter":
      return reply(res, BLOCKS.newsletter);

    case "sito":
      return reply(res, BLOCKS.sito);

    default:
      return reply(res, `
Posso aiutarti con:

👉 HERO  
👉 Video  
👉 Acquisto  
👉 Supporto tecnico  
👉 Newsletter  
👉 Social  
👉 Sito

Scrivi una parola chiave, ad esempio: "hero", "video", "social", "newsletter".
`);
  }
}

// =========================
// AVVIO SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MewingMarket AI attivo sulla porta " + PORT);
});
