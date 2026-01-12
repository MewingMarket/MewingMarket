// ---------------------------------------------
// BLOCCHI BASE: IMPORT, SETUP, STATICI, REDIRECT
// ---------------------------------------------
const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const fetch = require("node-fetch");

const app = express();
app.disable("x-powered-by");

// Cartella pubblica (serve HTML, CSS, JS)
app.use(express.static(path.join(process.cwd(), "public")));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// Espone products.json al frontend
app.get("/products.json", (req, res) => {
  res.sendFile(path.join(process.cwd(), "data", "products.json"));
});

// Redirect HTTPS + WWW
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers.host;

  if (proto !== "https") return res.redirect(301, `https://${host}${req.url}`);
  if (req.hostname === "mewingmarket.it") return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
  if (!host.startsWith("www.")) return res.redirect(301, `https://www.${host}${req.url}`);

  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());// ---------------------------------------------
// USER STATE (BOT) + COOKIE UID
// ---------------------------------------------
const userStates = {};
function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

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
    userStates[uid] = { state: "menu", lastIntent: null, data: {} };
  }

  req.uid = uid;
  req.userState = userStates[uid];
  next();
});

// ---------------------------------------------
// CONFIG AIRTABLE
// ---------------------------------------------
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

// ---------------------------------------------
// SANITIZZAZIONE CAMPI (BLINDATURA TOTALE)
// ---------------------------------------------
function safeSlug(text) {
  return (text || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "prodotto-" + Date.now();
}

function cleanText(value, fallback = "") {
  return (value || "")
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "")
    || fallback;
}

function cleanNumber(value) {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

function cleanURL(value) {
  const url = (value || "").toString().trim();
  return url.startsWith("http") ? url : "";
}// ---------------------------------------------
// SYNC AIRTABLE (BLINDATO + SANITIZZATO)
// ---------------------------------------------
async function syncAirtable() {
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!data.records) return [];

    const products = data.records.map(record => {
      const f = record.fields;
      return {
        id: record.id,
        titolo: cleanText(f.Titolo, "Titolo mancante"),
        titoloBreve: cleanText(f.TitoloBreve, ""),
        slug: safeSlug(f.Slug),
        prezzo: cleanNumber(f.Prezzo),
        categoria: cleanText(f.Categoria, "Generico"),
        attivo: Boolean(f.Attivo),
        immagine: cleanURL(f.Immagine?.[0]?.url),
        linkPayhip: cleanURL(f.LinkPayhip),
        descrizioneBreve: cleanText(f.DescrizioneBreve, ""),
        descrizioneLunga: cleanText(f.DescrizioneLunga, "")
      };
    });

    const activeProducts = products.filter(p => p.attivo);

    fs.writeFileSync("./data/products.json", JSON.stringify(activeProducts, null, 2));
    console.log(`products.json aggiornato da Airtable (${activeProducts.length} prodotti attivi)`);

    return activeProducts;

  } catch (err) {
    console.error("Errore sync Airtable:", err);
    return [];
  }
}// ---------------------------------------------
// CARICAMENTO PRODOTTI DA FILE
// ---------------------------------------------
let PRODUCTS = [];

function loadProducts() {
  try {
    if (!fs.existsSync("./data/products.json")) {
      fs.writeFileSync("./data/products.json", "[]");
    }

    const raw = fs.readFileSync("./data/products.json", "utf8");
    if (!raw.trim()) {
      fs.writeFileSync("./data/products.json", "[]");
      PRODUCTS = [];
      return;
    }

    const all = JSON.parse(raw);
    PRODUCTS = all.filter(p => p.attivo === true);

    console.log("Catalogo aggiornato:", PRODUCTS.length, "prodotti attivi");

  } catch (err) {
    console.error("Errore caricamento products.json", err);
    PRODUCTS = [];
  }
}

// Carica prodotti all'avvio
loadProducts();

// Sync automatico ogni 5 minuti
setTimeout(() => {
  setInterval(async () => {
    console.log("⏳ Sync automatico Airtable...");
    await syncAirtable();
    loadProducts();
  }, 5 * 60 * 1000);
}, 5000);

// Endpoint sync manuale
app.get("/sync/airtable", async (req, res) => {
  try {
    const products = await syncAirtable();
    res.send(`Aggiornamento completato. Prodotti sincronizzati: ${products.length}`);
  } catch (err) {
    console.error("Errore durante la sync manuale:", err);
    res.status(500).send("Errore durante la sincronizzazione.");
  }
});    // ---------------------------------------------
// FUNZIONI BOT MANCANTI (DEVONO ESSERCI!)
// ---------------------------------------------

// Cambia lo stato dell’utente
function setState(uid, newState) {
  userStates[uid].state = newState;
}

// Risposta standard del bot
function reply(res, text) {
  res.json({ reply: text });
}  // ---------------------------------------------
// NORMALIZZAZIONE TESTO + FUNZIONI DI RICERCA
// ---------------------------------------------
function normalize(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MAIN_PRODUCT_SLUG = "guida-ecosistema-digitale-reale";

// Trova prodotto per slug
function findProductBySlug(slug) {
  return PRODUCTS.find(p => p.slug === slug);
}

// Trova prodotto da testo
function findProductFromText(text) {
  const t = normalize(text);
  return PRODUCTS.find(p =>
    normalize(p.titolo).includes(t) ||
    normalize(p.titoloBreve).includes(t) ||
    normalize(p.slug).includes(t) ||
    normalize(p.id).includes(t)
  );
}

// Lista prodotti per categoria
function listProductsByCategory(cat) {
  return PRODUCTS.filter(p => p.categoria === cat);
}
// ---------------------------------------------
// RISPOSTE PRODOTTO (BOT)
// ---------------------------------------------
function productReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";

  let base = `
📘 *${p.titolo}*

${p.descrizioneBreve}

💰 Prezzo: ${p.prezzo}
👉 Acquista ora su Payhip  
${p.linkPayhip}
`;

  if (p.slug === MAIN_PRODUCT_SLUG) {
    base += `
🎥 Vuoi vedere il video di presentazione?  
Scrivi: "video" oppure "video ecosistema".
`;
  }

  base += `

Se vuoi un altro prodotto, scrivi il nome o "catalogo".`;

  return base;
}

function productLongReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";
  return `
📘 *${p.titolo}* — Dettagli completi

${p.descrizioneLunga}

💰 Prezzo: ${p.prezzo}
👉 Acquista ora su Payhip  
${p.linkPayhip}

Vuoi acquistarlo o tornare al menu?
`;
}

function productImageReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";
  return `
🖼 Copertina di *${p.titoloBreve}*

${p.immagine}

Puoi acquistarlo qui:  
${p.linkPayhip}

Vuoi altre info su questo prodotto o tornare al menu?
`;
}// ---------------------------------------------
// DETECT INTENT (BOT) — PATCHATO SOLO NEI CAMPI
// ---------------------------------------------
function detectIntent(rawText) {
  const t = normalize(rawText);

  if (
    t.includes("menu") ||
    t.includes("inizio") ||
    t.includes("start") ||
    t.includes("opzioni") ||
    t.includes("help") ||
    t.includes("informazioni")
  ) {
    return { intent: "menu", sub: null };
  }

  if (
    t.includes("video hero") ||
    t.includes("video ecosistema") ||
    t.includes("anteprima") ||
    t.includes("presentazione")
  ) {
    return { intent: "video_main", sub: MAIN_PRODUCT_SLUG };
  }

  if (
    t.includes("hero") ||
    t.includes("ecosistema") ||
    t.includes("prodotto principale") ||
    t.includes("comprare hero") ||
    t.includes("comprare ecosistema") ||
    t.includes("acquistare hero") ||
    t.includes("acquistare ecosistema") ||
    t.includes("prezzo hero") ||
    t.includes("prezzo ecosistema") ||
    t.includes("cosa include hero") ||
    t.includes("cosa include ecosistema") ||
    t.includes("template")
  ) {
    return { intent: "commerciale_main", sub: MAIN_PRODUCT_SLUG };
  }

  if (
    t.includes("instagram") || t.includes("tiktok") || t.includes("tik tok") ||
    t.includes("youtube") || t.includes("you tube") ||
    t.includes("facebook") || t.includes("threads") ||
    t.includes("linkedin") || t === "x" || t.includes("twitter") ||
    t.includes("social")
  ) {
    return { intent: "social", sub: null };
  }

  if (t.includes("catalogo") || t.includes("prodotti") || t.includes("lista")) {
    return { intent: "catalogo", sub: null };
  }

  if (t.includes("novita") || t.includes("nuovi") || t.includes("nuovo")) {
    return { intent: "novita", sub: null };
  }

  if (t.includes("promo") || t.includes("sconto") || t.includes("offerta")) {
    return { intent: "promozioni", sub: null };
  }

  if (t.includes("consigliami") || t.includes("consiglio") || t.includes("cosa compro")) {
    return { intent: "consiglio", sub: null };
  }

  if (t.includes("scegli tu") || t.includes("aiutami a scegliere") || t.includes("non so cosa scegliere")) {
    return { intent: "scegli", sub: null };
  }

  if (t.includes("approfondisci") || t.includes("piu dettagli") || t.includes("dimmi di piu")) {
    return { intent: "approfondisci", sub: null };
  }

  if (t.includes("immagine") || t.includes("copertina") || t.includes("cover")) {
    return { intent: "immagine", sub: null };
  }

  if (
    t.includes("supporto") || t.includes("assistenza") ||
    t.includes("problema") || t.includes("errore") ||
    t.includes("faq") || t.includes("domande frequenti") ||
    t.includes("download non funziona") || t.includes("download") ||
    t.includes("payhip") || t.includes("pagamento") ||
    t.includes("rimborso") ||
    t.includes("non ho ricevuto l email")
  ) {
    return { intent: "supporto", sub: null };
  }

  if (
    t.includes("newsletter") ||
    t.includes("iscrizione") ||
    t.includes("aggiornamenti") ||
    t.includes("news")
  ) {
    return { intent: "newsletter", sub: null };
  }

  if (t.includes("sito") || t.includes("website") || t.includes("home") || t.includes("mewingmarket")) {
    return { intent: "sito", sub: null };
  }

  if (t.includes("cerca") || t.includes("trova") || t.includes("search")) {
    return { intent: "cerca", sub: rawText };
  }

  if (
    t.includes("non so") || t.includes("boh") || t.includes("cosa") ||
    t.includes("domanda generica") || t.includes("aiuto") || t.includes("info")
  ) {
    return { intent: "fallback_soft", sub: null };
  }

  if (
    t.includes("acquisto") ||
    t.includes("acquista") ||
    t.includes("compra") ||
    t.includes("comprare") ||
    t.includes("lo prendo") ||
    t.includes("lo compro") ||
    t.includes("prendo") ||
    t.includes("comprare subito") ||
    t.includes("voglio comprarlo") ||
    t.includes("voglio acquistarlo")
  ) {
    return { intent: "acquisto", sub: null };
  }

  if (
    t === "video" ||
    t.includes("guarda video") ||
    t.includes("mostra video") ||
    t.includes("fammi vedere il video") ||
    t.includes("trailer")
  ) {
    return { intent: "video_generico", sub: null };
  }

  if (
    t.includes("contatti") ||
    t.includes("email") ||
    t.includes("whatsapp") ||
    t.includes("numero") ||
    t.includes("telefono") ||
    t.includes("supporto diretto")
  ) {
    return { intent: "contatti", sub: null };
  }

  if (
    t.includes("prezzo") ||
    t.includes("quanto costa") ||
    t.includes("costo") ||
    t.includes("quanto viene") ||
    t.includes("quanto è")
  ) {
    return { intent: "prezzo", sub: null };
  }

  if (
    t.includes("dettagli") ||
    t.includes("info") ||
    t.includes("informazioni") ||
    t.includes("dimmi di più") ||
    t.includes("cosa include")
  ) {
    return { intent: "dettagli", sub: null };
  }

  if (
    t.includes("iscrivimi") ||
    t.includes("voglio iscrivermi") ||
    t.includes("attiva newsletter")
  ) {
    return { intent: "newsletter_iscrizione", sub: null };
  }

  if (
    t.includes("annulla iscrizione") ||
    t.includes("disiscrivimi") ||
    t.includes("togli newsletter")
  ) {
    return { intent: "newsletter_disiscrizione", sub: null };
  }

  if (
    t.includes("non funziona") ||
    t.includes("errore") ||
    t.includes("problema") ||
    t.includes("bug")
  ) {
    return { intent: "supporto_tecnico", sub: null };
  }

  if (
    t.includes("non riesco a scaricare") ||
    t.includes("download non va") ||
    t.includes("download non funziona")
  ) {
    return { intent: "download", sub: null };
  }

  if (
    t.includes("rimborso") ||
    t.includes("voglio un rimborso") ||
    t.includes("restituzione")
  ) {
    return { intent: "rimborso", sub: null };
  }

  // MATCH PRODOTTI (PATCHATO)
  for (const p of PRODUCTS) {
    const titolo = normalize(p.titolo);
    const breve = normalize(p.titoloBreve);
    const slug = normalize(p.slug);
    const id = normalize(p.id);

    if (
      t.includes(titolo) ||
      t.includes(breve) ||
      t.includes(slug) ||
      t.includes(id)
    ) {
      return { intent: "prodotto", sub: p.slug };
    }
  }

  // MATCH CATEGORIA (PATCHATO)
  for (const p of PRODUCTS) {
    const catNorm = normalize(p.categoria);
    if (catNorm && t.includes(catNorm)) {
      return { intent: "categoria", sub: p.categoria };
    }
  }

  return { intent: "fallback", sub: null };
}

// ---------------------------------------------
// CHAT ENDPOINT
// ---------------------------------------------
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return reply(res, "Scrivi un messaggio così posso aiutarti.");
  }

  const uid = req.uid;
  const { intent, sub } = detectIntent(message);

  userStates[uid].lastIntent = intent;

  return handleConversation(req, res, intent, sub, message);
});

// ---------------------------------------------
// HANDLE CONVERSATION (PATCHATI SOLO I CAMPI)
// ---------------------------------------------
function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const state = userStates[uid];
  const mainProduct = findProductBySlug(MAIN_PRODUCT_SLUG);

  // MENU
  if (intent === "menu") {
    setState(uid, "menu");
    return reply(res, `
Ciao! 👋  
Sono qui per aiutarti con la *Guida Completa all’Ecosistema Digitale Reale*, gli altri prodotti, il supporto, la newsletter e molto altro.

Scrivi quello che ti serve oppure "catalogo".
`);
  }

  // CATALOGO
  if (intent === "catalogo") {
    setState(uid, "catalogo");
    if (!PRODUCTS.length) return reply(res, "Per ora il catalogo è vuoto.");

    let out = "📚 *Catalogo MewingMarket*\n\n";
    for (const p of PRODUCTS) {
      out += `• *${p.titoloBreve}* — ${p.prezzo}\n${p.linkPayhip}\n\n`;
    }
    out += "Se vuoi dettagli su un prodotto, scrivi il nome o lo slug.";
    return reply(res, out);
  }

  // NOVITÀ
  if (intent === "novita") {
    setState(uid, "novita");
    if (!PRODUCTS.length) return reply(res, "Non ci sono ancora novità in catalogo.");
    const latest = PRODUCTS.slice(-3);
    let out = "🆕 *Novità in MewingMarket*\n\n";
    for (const p of latest) {
      out += `• *${p.titoloBreve}* — ${p.prezzo}\n${p.linkPayhip}\n\n`;
    }
    out += "Vuoi altre informazioni o tornare al menu?";
    return reply(res, out);
  }

  // PROMOZIONI
  if (intent === "promozioni") {
    setState(uid, "promozioni");
    return reply(res, `
Al momento non ci sono promozioni attive.

I prezzi sono già impostati per offrirti il massimo valore.

Scrivi "consigliami un prodotto" oppure torna al menu.
`);
  }

  // CONSIGLIO
  if (intent === "consiglio") {
    setState(uid, "consiglio");
    const main = mainProduct || PRODUCTS[0];
    state.data.lastProductSlug = main?.slug;
    return reply(res, `
Ti consiglio di partire da questo:

${productReply(main)}
`);
  }

  // SCEGLI
  if (intent === "scegli") {
    setState(uid, "scegli");
    return reply(res, `
Per aiutarti a scegliere, dimmi cosa ti interessa di più:

• "Strumenti"  
• "Produttività"  
• "AI"  
• "Guide"  
• "Fiscale"
`);
  }

  // CATEGORIA
  if (intent === "categoria") {
    setState(uid, "categoria");
    const list = listProductsByCategory(sub);
    if (!list.length) return reply(res, "Non ho trovato prodotti in questa categoria.");
    let out = `📂 *Categoria: ${sub}*\n\n`;
    for (const p of list) {
      out += `• *${p.titoloBreve}* — ${p.prezzo}\n${p.linkPayhip}\n\n`;
    }
    out += "Vuoi dettagli su uno di questi prodotti o tornare al menu?";
    return reply(res, out);
  }

  // PRODOTTO
  if (intent === "prodotto") {
    setState(uid, "prodotto");
    const p = findProductBySlug(sub) || findProductFromText(rawText);
    state.data.lastProductSlug = p?.slug;
    return reply(res, productReply(p));
  }

  // APPROFONDISCI
  if (intent === "approfondisci") {
    setState(uid, "approfondisci");
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);
    if (!p) {
      return reply(res, `
Dimmi su quale prodotto vuoi approfondire.
`);
    }
    return reply(res, productLongReply(p));
  }

  // IMMAGINE
  if (intent === "immagine") {
    setState(uid, "immagine");
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);
    if (!p) {
      return reply(res, `
Dimmi di quale prodotto vuoi vedere la copertina.
`);
    }
    return reply(res, productImageReply(p));
  }

  // ACQUISTO
  if (intent === "acquisto") {
    let p = null;

    if (state.data.lastProductSlug) {
      p = findProductBySlug(state.data.lastProductSlug);
    }
    if (!p) p = findProductFromText(rawText);

    if (!p) {
      return reply(res, `
Quale prodotto vuoi acquistare?

Scrivi il nome, lo slug oppure "catalogo".
`);
    }

    return reply(res, `
Perfetto! 🎉

👉 Puoi acquistarlo qui:
${p.linkPayhip}

Vuoi vedere altri dettagli o tornare al menu?
`);
  }

  // VIDEO GENERICO
  if (intent === "video_generico") {
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);
    if (!p) p = mainProduct;

    if (!p) return reply(res, "Non trovo un prodotto associato al video.");

    return reply(res, `
🎥 Ecco il video di presentazione:
${p.immagine || "https://youtube.com/shorts/YoOXWUajbQc"}

Vuoi acquistarlo o tornare al menu?
`);
  }

  // CONTATTI
  if (intent === "contatti") {
    return reply(res, `
📞 *Contatti MewingMarket*

Email: support@mewingmarket.it  
WhatsApp: 352 026 6660  
`);
  }

  // PREZZO
  if (intent === "prezzo") {
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);

    if (!p) return reply(res, "Di quale prodotto vuoi sapere il prezzo?");

    return reply(res, `
💰 Prezzo di *${p.titoloBreve}*: ${p.prezzo}

Vuoi acquistarlo o vedere altri dettagli?
`);
  }

  // DETTAGLI
  if (intent === "dettagli") {
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);

    if (!p) return reply(res, "Dimmi quale prodotto vuoi approfondire.");

    return reply(res, productLongReply(p));
  }

  // NEWSLETTER ISCRIZIONE
  if (intent === "newsletter_iscrizione") {
    return reply(res, `
Perfetto! 🎉

Puoi iscriverti qui:
${LINKS.newsletter}
`);
  }

  // NEWSLETTER DISISCRIZIONE
  if (intent === "newsletter_disiscrizione") {
    return reply(res, `
Nessun problema.

Puoi annullare l’iscrizione qui:
${LINKS.disiscrizione}
`);
  }

  // SUPPORTO TECNICO
  if (intent === "supporto_tecnico") {
    return reply(res, SUPPORTO);
  }

  // DOWNLOAD
  if (intent === "download") {
    return reply(res, HELP_DESK.download);
  }

  // RIMBORSO
  if (intent === "rimborso") {
    return reply(res, HELP_DESK.rimborso);
  }

  // COMMERCIALE MAIN
  if (intent === "commerciale_main") {
    setState(uid, "commerciale_main");
    state.data.lastProductSlug = MAIN_PRODUCT_SLUG;

    if (!mainProduct) {
      return reply(res, "Non trovo la guida principale nel catalogo.");
    }

    return reply(res, `
📘 *${mainProduct.titolo}*

${mainProduct.descrizioneBreve}

💰 Prezzo: ${mainProduct.prezzo}
👉 Acquista ora  
${mainProduct.linkPayhip}

Vuoi vedere il video di presentazione o preferisci acquistare subito?
`);
  }

  // VIDEO MAIN (risposta generica)
  if (intent === "video_main") {
    setState(uid, "video_main");
    return reply(res, `
🎥 Ecco il video della *Guida Completa all’Ecosistema Digitale Reale*:

https://youtube.com/shorts/YoOXWUajbQc

Vuoi acquistare la guida o tornare al menu?
`);
  }

  // Stato: video_main (utente risponde dopo il video)
  if (state.state === "video_main") {
    if (isYes(rawText)) {
      return reply(res, `
Perfetto! Puoi acquistare qui:

${mainProduct ? mainProduct.linkPayhip : LINKS.store}

Hai bisogno di altro o vuoi tornare al menu?
`);
    }
  }

  // SOCIAL
  if (intent === "social") {
    setState(uid, "social");
    return reply(res, `
📲 Social ufficiali:

Instagram: ${LINKS.instagram}  
TikTok: ${LINKS.tiktok}  
YouTube: ${LINKS.youtube}  
Facebook: ${LINKS.facebook}  
X: ${LINKS.x}  
Threads: ${LINKS.threads}  
LinkedIn: ${LINKS.linkedin}

Vuoi tornare al menu?
`);
  }

  // SUPPORTO GENERALE
  if (intent === "supporto") {
    setState(uid, "supporto");
    const t = normalize(rawText);

    if (t.includes("scaricare") || t.includes("download")) {
      return reply(res, HELP_DESK.download + "\n\nVuoi altro supporto o tornare al menu?");
    }

    if (t.includes("payhip")) {
      return reply(res, HELP_DESK.payhip + "\n\nVuoi altro supporto o tornare al menu?");
    }

    if (t.includes("rimborso")) {
      return reply(res, HELP_DESK.rimborso + "\n\nVuoi altro supporto o tornare al menu?");
    }

    if (t.includes("email") || t.includes("contatto") || t.includes("whatsapp")) {
      return reply(res, HELP_DESK.contatto + "\n\nVuoi altro supporto o tornare al menu?");
    }

    return reply(res, FAQ_BLOCK + "\n\nScrivi la tua domanda oppure 'menu'.");
  }

  // NEWSLETTER — NORMALIZZAZIONE TESTO
  const t = normalize(rawText);

  // NEWSLETTER — ISCRIZIONE DIRETTA
  if (
    t.includes("iscrizione") ||
    t.includes("iscrivimi") ||
    t.includes("voglio iscrivermi") ||
    t.includes("attiva newsletter") ||
    t.includes("newsletter iscrizione")
  ) {
    return reply(res, `
Perfetto! 🎉

Puoi iscriverti qui:
${LINKS.newsletter}

Vuoi altro o torniamo al menu?
`);
  }

  // NEWSLETTER — DISISCRIZIONE DIRETTA
  if (
    t.includes("annulla iscrizione") ||
    t.includes("disiscrivimi") ||
    t.includes("togli newsletter") ||
    t.includes("stop newsletter") ||
    t.includes("disiscrizione")
  ) {
    return reply(res, `
Nessun problema.

Puoi annullare l’iscrizione qui:
${LINKS.disiscrizione}

Vuoi altro o torniamo al menu?
`);
  }

  // NEWSLETTER — MENU GENERALE
  if (intent === "newsletter") {
    return reply(res, `
Vuoi iscriverti o annullare l’iscrizione?

• "iscrivimi"  
• "annulla iscrizione"  
• "menu"
`);
  }

  // SITO
  if (intent === "sito") {
    setState(uid, "sito");
    return reply(res, `
🌐 Sito ufficiale MewingMarket:
${LINKS.sito}

🛒 Store completo su Payhip:
${LINKS.store}

Vuoi informazioni su un prodotto specifico o tornare al menu?
`);
  }

  // CERCA
  if (intent === "cerca") {
    setState(uid, "cerca");
    const q = normalize(rawText);
    const words = q.split(" ").filter(w => w.length > 3);
    const matches = PRODUCTS.filter(p => {
      const base = normalize(p.titolo + " " + p.titoloBreve + " " + p.categoria);
      return words.some(w => base.includes(w));
    });

    if (!matches.length) {
      return reply(res, "Non ho trovato prodotti per questa ricerca. Prova a usare il nome o la categoria.");
    }

    let out = "🔎 *Risultati trovati*\n\n";
    for (const p of matches) {
      out += `• *${p.titoloBreve}* — ${p.prezzo}\n${p.linkPayhip}\n\n`;
    }
    out += "Vuoi dettagli su uno di questi prodotti o tornare al menu?";
    return reply(res, out);
  }

  // FALLBACK SOFT
  if (intent === "fallback_soft") {
    return reply(res, `
Non ho capito bene, ma posso aiutarti.

Vuoi:
• informazioni su un prodotto  
• supporto  
• newsletter  
• social  
• tornare al menu  

Scrivi una parola chiave.
`);
  }

  // FALLBACK FINALE (ULTIMA RISPOSTA)
  return reply(res, `
Posso aiutarti con prodotti, supporto, newsletter o social.

Scrivi "menu" per vedere tutte le opzioni.
`);
} // ← CHIUDE handleConversation
// Avvio server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`MewingMarket AI attivo sulla porta ${PORT}`));
