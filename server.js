import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";

const app = express();
app.disable("x-powered-by");

// =========================
// REDIRECT SEO (HTTPS + WWW)
// =========================
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers.host;

  // Forza HTTPS
  if (proto !== "https") {
    return res.redirect(301, `https://${host}${req.url}`);
  }

  // Forza www.mewingmarket.it
  if (req.hostname === "mewingmarket.it") {
    return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
  }

  // Forza www su altri host
  if (!host.startsWith("www.")) {
    return res.redirect(301, `https://www.${host}${req.url}`);
  }

  next();
});

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
// struttura: { mm_uid: { state, lastIntent, data: { lastProductSlug } } }

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
});// =========================
// CARICAMENTO CATALOGO DINAMICO
// =========================
let PRODUCTS = [];

function loadProducts() {
  try {
    const raw = fs.readFileSync("./public/products.json", "utf8");
    const all = JSON.parse(raw);

    // Usa solo prodotti attivi
    PRODUCTS = all.filter(p => String(p.Attivo).toLowerCase() === "yes");
    console.log("Catalogo aggiornato:", PRODUCTS.length, "prodotti attivi");
  } catch (err) {
    console.error("Errore caricamento products.json", err);
  }
}

loadProducts();
setInterval(loadProducts, 60000); // =========================
// FUNZIONI DI SUPPORTO
// =========================
function setState(uid, newState) {
  userStates[uid].state = newState;
}

function reply(res, text) {
  res.json({ reply: text });
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MAIN_PRODUCT_SLUG = "guida-ecosistema-digitale-reale";

function findProductBySlug(slug) {
  return PRODUCTS.find(p => p.Slug === slug);
}

function findProductFromText(text) {
  const t = normalize(text);
  return PRODUCTS.find(p =>
    normalize(p.Titolo).includes(t) ||
    normalize(p.TitoloBreve).includes(t) ||
    normalize(p.Slug).includes(t) ||
    normalize(p.ID).includes(t)
  );
}

function listProductsByCategory(cat) {
  return PRODUCTS.filter(p => p.Categoria === cat);
}

function productReply(p) {
  let base = `
📘 *${p.Titolo}*

${p.DescrizioneBreve}

💰 Prezzo: ${p.Prezzo}
👉 Acquista ora su Payhip  
${p.LinkPayhip}
`;

  // Solo per il prodotto principale: aggiungi il video
  if (p.Slug === MAIN_PRODUCT_SLUG) {
    base += `
🎥 Guarda il video del prodotto  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared
`;
  }

  return base + "\nVuoi sapere altro su questo prodotto?";
}

function productLongReply(p) {
  return `
📘 *${p.Titolo}* — Dettagli completi

${p.DescrizioneLunga}

💰 Prezzo: ${p.Prezzo}
👉 Acquista ora su Payhip  
${p.LinkPayhip}
`;
}

function productImageReply(p) {
  return `
🖼 Copertina di *${p.TitoloBreve}*

${p.Immagine}

Puoi acquistarlo qui:  
${p.LinkPayhip}
`;
} // =========================
// INTENT MATCHER
// =========================
function detectIntent(rawText) {
  const t = normalize(rawText);

  // SOCIAL
  if (
    t.includes("instagram") || t.includes("tiktok") || t.includes("tik tok") ||
    t.includes("youtube") || t.includes("you tube") ||
    t.includes("facebook") || t.includes("threads") ||
    t.includes("linkedin") || t === "x" || t.includes("twitter") ||
    t.includes("social")
  ) {
    return { intent: "social", sub: null };
  }

  // CATALOGO
  if (t.includes("catalogo") || t.includes("prodotti") || t.includes("lista")) {
    return { intent: "catalogo", sub: null };
  }

  // NOVITÀ
  if (t.includes("novita") || t.includes("nuovi") || t.includes("nuovo")) {
    return { intent: "novita", sub: null };
  }

  // PROMOZIONI
  if (t.includes("promo") || t.includes("sconto") || t.includes("offerta")) {
    return { intent: "promozioni", sub: null };
  }

  // CONSIGLIO
  if (t.includes("consigliami") || t.includes("consiglio") || t.includes("cosa compro")) {
    return { intent: "consiglio", sub: null };
  }

  // AIUTAMI A SCEGLIERE
  if (t.includes("scegli tu") || t.includes("aiutami a scegliere") || t.includes("non so cosa scegliere")) {
    return { intent: "scegli", sub: null };
  }

  // APPROFONDISCI
  if (t.includes("approfondisci") || t.includes("piu dettagli") || t.includes("dimmi di piu")) {
    return { intent: "approfondisci", sub: null };
  }

  // IMMAGINE / COPERTINA
  if (t.includes("immagine") || t.includes("copertina") || t.includes("cover")) {
    return { intent: "immagine", sub: null };
  }

  // CATEGORIA (se trova una categoria nel testo)
  for (const p of PRODUCTS) {
    const catNorm = normalize(p.Categoria);
    if (catNorm && t.includes(catNorm)) {
      return { intent: "categoria", sub: p.Categoria };
    }
  }

  // PRODOTTO SPECIFICO (Titolo, TitoloBreve, Slug, ID)
  for (const p of PRODUCTS) {
    const titolo = normalize(p.Titolo);
    const breve = normalize(p.TitoloBreve);
    const slug = normalize(p.Slug);
    const id = normalize(p.ID);

    if (t.includes(titolo) || t.includes(breve) || t.includes(slug) || t.includes(id)) {
      return { intent: "prodotto", sub: p.Slug };
    }
  }

  // SUPPORTO / PROBLEMI
  if (
    t.includes("download") || t.includes("scaricare") || t.includes("file") || t.includes("zip") ||
    t.includes("errore") || t.includes("non funziona") || t.includes("problema") || t.includes("bug") ||
    t.includes("pagamento") || t.includes("carta") || t.includes("paypal") ||
    t.includes("rimborso") || t.includes("refund") ||
    t.includes("email") || t.includes("mail") || t.includes("ricevuta") || t.includes("conferma")
  ) {
    return { intent: "supporto", sub: null };
  }

  // NEWSLETTER
  if (t.includes("newsletter") || t.includes("iscrizione") || t.includes("disiscrizione")) {
    return { intent: "newsletter", sub: null };
  }

  // VIDEO
  if (t.includes("video") || t.includes("anteprima")) {
    return { intent: "video", sub: null };
  }

  // SITO
  if (t.includes("sito") || t.includes("website") || t.includes("home") || t.includes("mewingmarket")) {
    return { intent: "sito", sub: null };
  }

  // CERCA
  if (t.includes("cerca") || t.includes("trova") || t.includes("search")) {
    return { intent: "cerca", sub: rawText };
  }

  // FALLBACK
  return { intent: "fallback", sub: null };
}// =========================
// LINK UFFICIALI
// =========================
const LINKS = {
  instagram: "https://www.instagram.com/mewingmarket",
  tiktok: "https://tiktok.com/@mewingmarket",
  youtube: "https://www.youtube.com/@mewingmarket2",
  facebook: "https://www.facebook.com/profile.php?id=61584779793628",
  x: "https://x.com/mewingm8",
  threads: "https://www.threads.net/@mewingmarket",
  linkedin: "https://www.linkedin.com/in/simone-griseri-5368a7394",
  sito: "https://www.mewingmarket.it",
  store: "https://payhip.com/MewingMarket",
  newsletter: "https://mewingmarket.it/iscrizione.html",
  disiscrizione: "https://mewingmarket.it/disiscriviti.html"
};

// =========================
// SUPPORTO
// =========================
const SUPPORTO = `
📞 *Supporto MewingMarket*

Se hai problemi con download, pagamenti o file:

📧 Email: supporto@mewingmarket.it  
📱 WhatsApp: 352 026 6660

Ti rispondiamo entro poche ore.
`;// =========================
// ROUTER PRINCIPALE
// =========================
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return reply(res, "Scrivi un messaggio così posso aiutarti.");
  }

  const uid = req.uid;
  const { intent, sub } = detectIntent(message);

  userStates[uid].lastIntent = intent;

  return handleConversation(req, res, intent, sub, message);
});// =========================
// GESTIONE CONVERSAZIONE
// =========================
function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const state = userStates[uid];

  // SOCIAL
  if (intent === "social") {
    return reply(res, `
🌐 Social MewingMarket

Instagram: ${LINKS.instagram}
TikTok: ${LINKS.tiktok}
YouTube: ${LINKS.youtube}
Facebook: ${LINKS.facebook}
X: ${LINKS.x}
Threads: ${LINKS.threads}
LinkedIn: ${LINKS.linkedin}
`);
  }

  // CATALOGO COMPLETO
  if (intent === "catalogo") {
    if (!PRODUCTS.length) return reply(res, "Per ora il catalogo è vuoto.");
    let out = "📚 *Catalogo MewingMarket*\n\n";
    for (const p of PRODUCTS) {
      out += `• *${p.TitoloBreve}* — ${p.Prezzo}\n${p.LinkPayhip}\n\n`;
    }
    return reply(res, out);
  }

  // NOVITÀ (ultimi N prodotti dell'array)
  if (intent === "novita") {
    if (!PRODUCTS.length) return reply(res, "Non ci sono ancora novità in catalogo.");
    const latest = PRODUCTS.slice(-3); // ultimi 3
    let out = "🆕 *Novità in MewingMarket*\n\n";
    for (const p of latest) {
      out += `• *${p.TitoloBreve}* — ${p.Prezzo}\n${p.LinkPayhip}\n\n`;
    }
    return reply(res, out);
  }

  // PROMOZIONI (per ora messaggio generico)
  if (intent === "promozioni") {
    return reply(res, `
Al momento non ci sono promozioni attive.

I prezzi sono già ottimizzati per offrirti il massimo valore in rapporto a tempo, competenze e risultati.

Se vuoi, posso consigliarti da dove iniziare in base al tuo obiettivo. Scrivi: "aiutami a scegliere".
`);
  }

  // CONSIGLIO (consigliami un prodotto)
  if (intent === "consiglio") {
    const main = findProductBySlug(MAIN_PRODUCT_SLUG) || PRODUCTS[0];
    state.data.lastProductSlug = main?.Slug;
    return reply(res, `
Ti consiglio di partire da questo:

${productReply(main)}
`);
  }

  // AIUTAMI A SCEGLIERE (domanda guidata ma risposta single-shot)
  if (intent === "scegli") {
    return reply(res, `
Per aiutarti a scegliere, dimmi cosa ti interessa di più:

• "Strumenti" → per template, workbook e strumenti operativi  
• "Produttività" → per planner, AI nella routine e organizzazione  
• "AI" → per guide e prompt sull'Intelligenza Artificiale  
• "Guide" → per capire l'ecosistema, contenuti, business  
• "Fiscale" → per gestire Partita IVA e numeri senza ansia

Puoi anche scrivere direttamente il tuo obiettivo, ad esempio: "voglio migliorare la produttività" o "voglio capire le basi del digitale".
`);
  }

  // CATEGORIA
  if (intent === "categoria") {
    const list = listProductsByCategory(sub);
    if (!list.length) return reply(res, "Non ho trovato prodotti in questa categoria.");
    let out = `📂 *Categoria: ${sub}*\n\n`;
    for (const p of list) {
      out += `• *${p.TitoloBreve}* — ${p.Prezzo}\n${p.LinkPayhip}\n\n`;
    }
    return reply(res, out);
  }

  // PRODOTTO
  if (intent === "prodotto") {
    const p = findProductBySlug(sub) || findProductFromText(rawText);
    if (!p) return reply(res, "Non ho trovato questo prodotto nel catalogo.");
    state.data.lastProductSlug = p.Slug;
    return reply(res, productReply(p));
  }

  // APPROFONDISCI (usa lastProduct se esiste)
  if (intent === "approfondisci") {
    let p = null;

    if (state.data.lastProductSlug) {
      p = findProductBySlug(state.data.lastProductSlug);
    }
    if (!p) {
      p = findProductFromText(rawText);
    }
    if (!p) {
      return reply(res, `
Dimmi su quale prodotto vuoi approfondire, ad esempio:

"Approfondisci Ecosistema", "Approfondisci Workbook", "Approfondisci Fisco".
`);
    }
    return reply(res, productLongReply(p));
  }

  // IMMAGINE PRODOTTO
  if (intent === "immagine") {
    let p = null;
    if (state.data.lastProductSlug) {
      p = findProductBySlug(state.data.lastProductSlug);
    }
    if (!p) {
      p = findProductFromText(rawText);
    }
    if (!p) {
      return reply(res, `
Dimmi di quale prodotto vuoi vedere la copertina, ad esempio:

"Copertina Ecosistema", "Copertina Workbook", "Copertina Fisco".
`);
    }
    return reply(res, productImageReply(p));
  }

  // SUPPORTO
  if (intent === "supporto") {
    return reply(res, SUPPORTO);
  }

  // NEWSLETTER
  if (intent === "newsletter") {
    return reply(res, `
✉️ Newsletter MewingMarket

Iscriviti qui:  
${LINKS.newsletter}

Disiscriviti qui:  
${LINKS.disiscrizione}
`);
  }

  // VIDEO (solo prodotto principale)
  if (intent === "video") {
    const p = findProductBySlug(MAIN_PRODUCT_SLUG);
    return reply(res, `
🎥 Video del prodotto principale

${p ? p.Titolo : "Guida principale MewingMarket"}

👉 Guarda il video  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared
`);
  }

  // SITO
  if (intent === "sito") {
    return reply(res, `
🌐 Sito ufficiale MewingMarket:
${LINKS.sito}

🛒 Store completo su Payhip:
${LINKS.store}
`);
  }

  // CERCA PRODOTTO (ricerca fuzzy semplice)
  if (intent === "cerca") {
    const q = normalize(rawText);
    const words = q.split(" ").filter(w => w.length > 3);
    const matches = PRODUCTS.filter(p => {
      const base = normalize(p.Titolo + " " + p.TitoloBreve + " " + p.Categoria);
      return words.some(w => base.includes(w));
    });

    if (!matches.length) {
      return reply(res, "Non ho trovato prodotti per questa ricerca. Prova a usare il nome o la categoria.");
    }

    let out = "🔎 *Risultati trovati*\n\n";
    for (const p of matches) {
      out += `• *${p.TitoloBreve}* — ${p.Prezzo}\n${p.LinkPayhip}\n\n`;
    }
    return reply(res, out);
  }

  // FALLBACK
  return reply(res, `
Sono l’assistente di MewingMarket.

Posso aiutarti con:

👉 Catalogo (scrivi: "catalogo")  
👉 Prodotti specifici (es: "Ecosistema", "Workbook", "Fisco")  
👉 Categorie (es: "Produttività", "AI", "Guide", "Fiscale", "Strumenti")  
👉 Consigli (scrivi: "consigliami un prodotto" o "aiutami a scegliere")  
👉 Supporto tecnico (download, pagamenti, email)  
👉 Newsletter (iscrizione / disiscrizione)  
👉 Social (Instagram, TikTok, YouTube, ecc.)  
👉 Video del prodotto principale (scrivi: "video")  
👉 Sito e store (scrivi: "sito")

Scrivi una parola chiave o l’obiettivo che hai in mente.
`);
}// =========================
// AVVIO SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MewingMarket AI attivo sulla porta " + PORT);
});
