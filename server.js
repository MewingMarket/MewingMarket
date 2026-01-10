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

  if (proto !== "https") {
    return res.redirect(301, `https://${host}${req.url}`);
  }

  if (req.hostname === "mewingmarket.it") {
    return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
  }

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
    PRODUCTS = JSON.parse(raw);
    console.log("Catalogo aggiornato:", PRODUCTS.length, "prodotti");
  } catch (err) {
    console.error("Errore caricamento products.json", err);
  }
}

loadProducts();
setInterval(loadProducts, 60000);// =========================
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

function findProduct(query) {
  const t = normalize(query);
  return PRODUCTS.find(p =>
    normalize(p.Titolo).includes(t) ||
    normalize(p.Slug).includes(t) ||
    normalize(p.Categoria).includes(t)
  );
}

const MAIN_PRODUCT_SLUG = "guida-ecosistema-digitale-reale";

function productReply(p) {
  let base = `
📘 *${p.Titolo}*

${p.DescrizioneBreve}

💰 Prezzo: ${p.Prezzo}
👉 Acquista ora  
${p.Link}
`;

  if (p.Slug === MAIN_PRODUCT_SLUG) {
    base += `
🎥 Guarda il video  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared
`;
  }

  return base + "\nVuoi sapere altro su questo prodotto?";
}// =========================
// INTENT MATCHER
// =========================
function detectIntent(rawText) {
  const t = normalize(rawText);

  // SOCIAL
  if (
    t.includes("instagram") || t.includes("tiktok") || t.includes("youtube") ||
    t.includes("facebook") || t.includes("threads") || t.includes("linkedin") ||
    t === "x" || t.includes("twitter") || t.includes("social")
  ) {
    return { intent: "social", sub: null };
  }

  // CATALOGO
  if (t.includes("catalogo") || t.includes("prodotti") || t.includes("lista")) {
    return { intent: "catalogo", sub: null };
  }

  // CONSIGLIO
  if (t.includes("consigliami") || t.includes("consiglio") || t.includes("cosa compro")) {
    return { intent: "consiglio", sub: null };
  }

  // CATEGORIA
  for (const p of PRODUCTS) {
    if (t.includes(normalize(p.Categoria))) {
      return { intent: "categoria", sub: p.Categoria };
    }
  }

  // PRODOTTO SPECIFICO
  for (const p of PRODUCTS) {
    if (t.includes(normalize(p.Titolo)) || t.includes(normalize(p.Slug))) {
      return { intent: "prodotto", sub: p.Slug };
    }
  }

  // SUPPORTO
  if (t.includes("download") || t.includes("errore") || t.includes("rimborso") ||
      t.includes("email") || t.includes("file") || t.includes("pagamento")) {
    return { intent: "supporto", sub: null };
  }

  // NEWSLETTER
  if (t.includes("newsletter") || t.includes("iscrizione")) {
    return { intent: "newsletter", sub: null };
  }

  // VIDEO
  if (t.includes("video")) {
    return { intent: "video", sub: null };
  }

  // SITO
  if (t.includes("sito") || t.includes("website") || t.includes("home")) {
    return { intent: "sito", sub: null };
  }

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

📧 Email: supporto@mewingmarket.it  
📱 WhatsApp: 352 026 6660

Rispondiamo entro poche ore.
`;// =========================
// GESTIONE CONVERSAZIONE
// =========================
function handleConversation(req, res, intent, sub) {

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

  // CATALOGO
  if (intent === "catalogo") {
    let out = "📚 *Catalogo MewingMarket*\n\n";
    for (const p of PRODUCTS) {
      out += `• *${p.Titolo}* — ${p.Prezzo}\n${p.Link}\n\n`;
    }
    return reply(res, out);
  }

  // CONSIGLIO
  if (intent === "consiglio") {
    const p = PRODUCTS[0];
    return reply(res, `
Ti consiglio questo:

${productReply(p)}
`);
  }

  // CATEGORIA
  if (intent === "categoria") {
    const list = PRODUCTS.filter(p => p.Categoria === sub);
    let out = `📂 *Categoria: ${sub}*\n\n`;
    for (const p of list) {
      out += `• *${p.Titolo}* — ${p.Prezzo}\n${p.Link}\n\n`;
    }
    return reply(res, out);
  }

  // PRODOTTO
  if (intent === "prodotto") {
    const p = PRODUCTS.find(p => p.Slug === sub);
    if (p) return reply(res, productReply(p));
    return reply(res, "Non ho trovato questo prodotto.");
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
    const p = PRODUCTS.find(p => p.Slug === MAIN_PRODUCT_SLUG);
    return reply(res, `
🎥 Video del prodotto principale

${p.Titolo}

👉 Guarda il video  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared
`);
  }

  // SITO
  if (intent === "sito") {
    return reply(res, `
🌐 Sito ufficiale:
${LINKS.sito}

🛒 Store:
${LINKS.store}
`);
  }

  // FALLBACK
  return reply(res, `
Posso aiutarti con:

👉 Catalogo  
👉 Prodotti  
👉 Supporto  
👉 Newsletter  
👉 Social  
👉 Video  
👉 Consigliami un prodotto  
👉 Nome di un prodotto

Scrivi una parola chiave.
`);
}// =========================
// AVVIO SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MewingMarket AI attivo sulla porta " + PORT);
});
