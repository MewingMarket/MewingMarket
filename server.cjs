const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const OpenAI = require("openai");
const cookieParser = require("cookie-parser");
const { Client } = require("@notionhq/client");
require("dotenv").config();

const app = express();
app.disable("x-powered-by");
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

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

let PRODUCTS = [];

function loadProducts() {
  try {
    const raw = fs.readFileSync("./public/products.json", "utf8");
    const all = JSON.parse(raw);
    PRODUCTS = all.filter(p => String(p.Attivo).toLowerCase() === "yes");
    console.log("Catalogo aggiornato:", PRODUCTS.length, "prodotti attivi");
  } catch (err) {
    console.error("Errore caricamento products.json", err);
  }
}

loadProducts();
setInterval(loadProducts, 60000);

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const NOTION_DB = process.env.NOTION_DB;

async function updateProductsFromNotion() {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_DB,
      filter: {
        property: "Attivo",
        checkbox: { equals: true }
      }
    });

    const products = response.results.map(page => {
      const props = page.properties;

      return {
        Titolo: props.Titolo?.title?.[0]?.text?.content || "",
        Attivo: "Yes",
        Categoria: props.Categoria?.select?.name || "",
        DescrizioneBreve: props.DescrizioneBreve?.rich_text?.[0]?.text?.content || "",
        DescrizioneLunga: props.DescrizioneLunga?.rich_text?.[0]?.text?.content || "",
        ID: props.ID?.rich_text?.[0]?.text?.content || "",
        Immagine: props.Immagine?.url || "",
        LinkPayhip: props.LinkPayhip?.url || "",
        Prezzo: props.Prezzo?.rich_text?.[0]?.text?.content || "",
        Slug: props.Slug?.rich_text?.[0]?.text?.content || "",
        TitoloBreve: props.TitoloBreve?.rich_text?.[0]?.text?.content || ""
      };
    });

    fs.writeFileSync("./public/products.json", JSON.stringify(products, null, 2), "utf8");
    console.log("products.json aggiornato da Notion:", products.length, "prodotti");

    loadProducts();
  } catch (err) {
    console.error("Errore aggiornamento Notion:", err.message);
  }
}

setInterval(updateProductsFromNotion, 5 * 60 * 1000);

app.get("/sync/notion", async (req, res) => {
  await updateProductsFromNotion();
  res.send("Aggiornamento completato.");
});function setState(uid, newState) {
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

function isYes(text) {
  const t = normalize(text);
  return ["si", "sì", "yes", "ok", "va bene", "certo"].some(w => t.includes(w));
}

function isNo(text) {
  const t = normalize(text);
  return ["no", "non ora", "magari dopo"].some(w => t.includes(w));
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
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";

  let base = `
📘 *${p.Titolo}*

${p.DescrizioneBreve}

💰 Prezzo: ${p.Prezzo}
👉 Acquista ora su Payhip  
${p.LinkPayhip}
`;

  if (p.Slug === MAIN_PRODUCT_SLUG) {
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
📘 *${p.Titolo}* — Dettagli completi

${p.DescrizioneLunga}

💰 Prezzo: ${p.Prezzo}
👉 Acquista ora su Payhip  
${p.LinkPayhip}

Vuoi acquistarlo o tornare al menu?
`;
}

function productImageReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";
  return `
🖼 Copertina di *${p.TitoloBreve}*

${p.Immagine}

Puoi acquistarlo qui:  
${p.LinkPayhip}

Vuoi altre info su questo prodotto o tornare al menu?
`;
}

const HELP_DESK = {
  download: `
<b>Non riesci a scaricare il prodotto?</b>

1. Controlla la tua email: dopo l’acquisto ricevi un’email con il link di download Payhip.
2. Verifica la cartella Spam o Promozioni.
3. Se non trovi l’email, accedi alla tua area Payhip usando lo stesso indirizzo usato per l’acquisto.
4. Se il link non funziona, prova con un altro browser o dispositivo.

Se hai ancora problemi, scrivi a <b>support@mewingmarket.it</b> o su WhatsApp al <b>352 026 6660</b>.
`,

  payhip: `
<b>Come funziona Payhip per i download digitali?</b>

Payhip gestisce pagamenti e download dei prodotti digitali.

- Dopo il pagamento ricevi subito un’email con il link per scaricare il prodotto.
- Il link è sicuro e personale.
- Puoi accedere ai tuoi acquisti anche dalla tua area Payhip usando la stessa email dell’acquisto.
- Il download è immediato e non richiede installazioni.

Se hai problemi con Payhip, scrivici in chat: ti aiutiamo subito.
`,

  rimborso: `
<b>Politica di rimborso per i prodotti digitali</b>

I prodotti digitali non prevedono rimborso una volta scaricati, in linea con la normativa sui contenuti digitali.

Se hai problemi tecnici con il download o non riesci ad accedere al prodotto, contattaci in chat, via email o WhatsApp: ti aiutiamo subito a risolvere.
`,

  contatto: `
<b>Come contattare il supporto</b>

Puoi contattare il supporto direttamente da questa chat oppure:

📧 Email: support@mewingmarket.it  
📱 WhatsApp: 352 026 6660  

Siamo disponibili per:
- problemi di download
- informazioni sui prodotti
- assistenza sugli acquisti
- domande tecniche
`,

  newsletter: `
<b>Come funziona la newsletter di MewingMarket?</b>

La newsletter ti permette di ricevere aggiornamenti, contenuti utili e novità sui prodotti.

Puoi iscriverti:
- dalla chat (rispondendo "iscrivimi")
- dalle pagine del sito
- dai link presenti nei nostri contenuti

L’iscrizione è gratuita e puoi annullarla in qualsiasi momento.
`
};

const FAQ_BLOCK = `
📌 *Supporto & Domande Frequenti*

• Come ricevo i prodotti dopo l'acquisto?  
• Quali metodi di pagamento accettate?  
• Posso richiedere un rimborso?  
• Non ho ricevuto l'email, cosa faccio?  
• I prodotti hanno una scadenza?  
• Posso condividere i file acquistati?  
• Offrite assistenza post-vendita?

Se mi scrivi la tua domanda in linguaggio naturale (es. "non riesco a scaricare"), ti rispondo in modo più preciso.
`;const LINKS = {
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

const SUPPORTO = `
📞 *Supporto MewingMarket*

Se hai problemi con download, pagamenti o file:

📧 Email: support@mewingmarket.it  
📱 WhatsApp: 352 026 6660

Ti rispondiamo rapidamente.
`;

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

  for (const p of PRODUCTS) {
    const titolo = normalize(p.Titolo);
    const breve = normalize(p.TitoloBreve);
    const slug = normalize(p.Slug);
    const id = normalize(p.ID);

    if (
      t.includes(titolo) ||
      t.includes(breve) ||
      t.includes(slug) ||
      t.includes(id)
    ) {
      return { intent: "prodotto", sub: p.Slug };
    }
  }

  for (const p of PRODUCTS) {
    const catNorm = normalize(p.Categoria);
    if (catNorm && t.includes(catNorm)) {
      return { intent: "categoria", sub: p.Categoria };
    }
  }

  return { intent: "fallback", sub: null };
}app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return reply(res, "Scrivi un messaggio così posso aiutarti.");
  }

  const uid = req.uid;
  const { intent, sub } = detectIntent(message);

  userStates[uid].lastIntent = intent;

  return handleConversation(req, res, intent, sub, message);
});

function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const state = userStates[uid];
  const mainProduct = findProductBySlug(MAIN_PRODUCT_SLUG);

  if (intent === "menu") {
    setState(uid, "menu");
    return reply(res, `
Ciao! 👋  
Sono qui per aiutarti con la *Guida Completa all’Ecosistema Digitale Reale*, gli altri prodotti, il supporto, la newsletter e molto altro.

Puoi chiedermi:
• informazioni su un prodotto  
• prezzo o cosa include  
• vedere il video della guida principale  
• supporto su download, pagamenti o Payhip  
• iscrizione / disiscrizione newsletter  
• link ai social  

Scrivi quello che ti serve oppure "catalogo".
`);
  }

  if (intent === "catalogo") {
    setState(uid, "catalogo");
    if (!PRODUCTS.length) return reply(res, "Per ora il catalogo è vuoto.");

    let out = "📚 *Catalogo MewingMarket*\n\n";
    for (const p of PRODUCTS) {
      out += `• *${p.TitoloBreve}* — ${p.Prezzo}\n${p.LinkPayhip}\n\n`;
    }
    out += "Se vuoi dettagli su un prodotto, scrivi il nome o lo slug.";
    return reply(res, out);
  }

  if (intent === "novita") {
    setState(uid, "novita");
    if (!PRODUCTS.length) return reply(res, "Non ci sono ancora novità in catalogo.");
    const latest = PRODUCTS.slice(-3);
    let out = "🆕 *Novità in MewingMarket*\n\n";
    for (const p of latest) {
      out += `• *${p.TitoloBreve}* — ${p.Prezzo}\n${p.LinkPayhip}\n\n`;
    }
    out += "Vuoi altre informazioni o tornare al menu?";
    return reply(res, out);
  }

  if (intent === "promozioni") {
    setState(uid, "promozioni");
    return reply(res, `
Al momento non ci sono promozioni attive.

I prezzi sono già impostati per offrirti il massimo valore in rapporto a tempo, competenze e risultati.

Se vuoi, posso consigliarti da dove iniziare in base al tuo obiettivo. Scrivi: "consigliami un prodotto" oppure torna al menu.
`);
  }

  if (intent === "consiglio") {
    setState(uid, "consiglio");
    const main = mainProduct || PRODUCTS[0];
    state.data.lastProductSlug = main?.Slug;
    return reply(res, `
Ti consiglio di partire da questo:

${productReply(main)}
`);
  }

  if (intent === "scegli") {
    setState(uid, "scegli");
    return reply(res, `
Per aiutarti a scegliere, dimmi cosa ti interessa di più:

• "Strumenti" → workbook e template operativi  
• "Produttività" → planner e strumenti per organizzarti  
• "AI" → guide e prompt sull'Intelligenza Artificiale  
• "Guide" → ecosistema digitale, contenuti, business  
• "Fiscale" → gestione Partita IVA e numeri

Oppure scrivi direttamente il tuo obiettivo (es. "voglio migliorare la produttività").
`);
  }

  if (intent === "categoria") {
    setState(uid, "categoria");
    const list = listProductsByCategory(sub);
    if (!list.length) return reply(res, "Non ho trovato prodotti in questa categoria.");
    let out = `📂 *Categoria: ${sub}*\n\n`;
    for (const p of list) {
      out += `• *${p.TitoloBreve}* — ${p.Prezzo}\n${p.LinkPayhip}\n\n`;
    }
    out += "Vuoi dettagli su uno di questi prodotti o tornare al menu?";
    return reply(res, out);
  }

  if (intent === "prodotto") {
    setState(uid, "prodotto");
    const p = findProductBySlug(sub) || findProductFromText(rawText);
    state.data.lastProductSlug = p?.Slug;
    return reply(res, productReply(p));
  }

  if (intent === "approfondisci") {
    setState(uid, "approfondisci");
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);
    if (!p) {
      return reply(res, `
Dimmi su quale prodotto vuoi approfondire, ad esempio:

"Approfondisci Ecosistema", "Approfondisci Workbook", "Approfondisci Fisco".
`);
    }
    return reply(res, productLongReply(p));
  }

  if (intent === "immagine") {
    setState(uid, "immagine");
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);
    if (!p) {
      return reply(res, `
Dimmi di quale prodotto vuoi vedere la copertina, ad esempio:

"Copertina Ecosistema", "Copertina Workbook", "Copertina Fisco".
`);
    }
    return reply(res, productImageReply(p));
  }

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
${p.LinkPayhip}

Vuoi vedere altri dettagli o tornare al menu?
`);
  }

  if (intent === "video_generico") {
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);
    if (!p) p = mainProduct;

    if (!p) return reply(res, "Non trovo un prodotto associato al video.");

    return reply(res, `
🎥 Ecco il video di presentazione:
${p.Immagine || "https://youtube.com/shorts/YoOXWUajbQc"}

Vuoi acquistarlo o tornare al menu?
`);
  }

  if (intent === "contatti") {
    return reply(res, `
📞 *Contatti MewingMarket*

Email: support@mewingmarket.it  
WhatsApp: 352 026 6660  

Scrivi pure il tuo problema e ti aiuto subito.
`);
  }

  if (intent === "prezzo") {
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);

    if (!p) return reply(res, "Di quale prodotto vuoi sapere il prezzo?");

    return reply(res, `
💰 Prezzo di *${p.TitoloBreve}*: ${p.Prezzo}

Vuoi acquistarlo o vedere altri dettagli?
`);
  }

  if (intent === "dettagli") {
    let p = null;
    if (state.data.lastProductSlug) p = findProductBySlug(state.data.lastProductSlug);
    if (!p) p = findProductFromText(rawText);

    if (!p) return reply(res, "Dimmi quale prodotto vuoi approfondire.");

    return reply(res, productLongReply(p));
  }

  if (intent === "newsletter_iscrizione") {
    return reply(res, `
Perfetto! 🎉

Puoi iscriverti qui:
${LINKS.newsletter}

Vuoi altro o tornare al menu?
`);
  }

  if (intent === "newsletter_disiscrizione") {
    return reply(res, `
Nessun problema.

Puoi annullare l’iscrizione qui:
${LINKS.disiscrizione}

Vuoi altro o tornare al menu?
`);
  }

  if (intent === "supporto_tecnico") {
    return reply(res, SUPPORTO);
  }

  if (intent === "download") {
    return reply(res, HELP_DESK.download);
  }

  if (intent === "rimborso") {
    return reply(res, HELP_DESK.rimborso);
        }if (intent === "commerciale_main") {
    setState(uid, "commerciale_main");
    state.data.lastProductSlug = MAIN_PRODUCT_SLUG;

    if (!mainProduct) {
      return reply(res, "Non trovo la guida principale nel catalogo in questo momento.");
    }

    return reply(res, `
📘 *${mainProduct.Titolo}*

${mainProduct.DescrizioneBreve}

💰 Prezzo: ${mainProduct.Prezzo}
👉 Acquista ora  
${mainProduct.LinkPayhip}

Vuoi vedere il video di presentazione o preferisci acquistare subito?
Scrivi "video" oppure "sì".
`);
  }

  if (state.state === "commerciale_main") {
    if (isYes(rawText)) {
      setState(uid, "acquisto_main");
      return reply(res, `
Perfetto! Puoi acquistare qui:

${mainProduct ? mainProduct.LinkPayhip : LINKS.store}

Vuoi tornare al menu o hai bisogno di altro?
`);
    }

    if (rawText.toLowerCase().includes("video")) {
      setState(uid, "video_main");
      return reply(res, `
🎥 Ecco il video della guida:

https://youtube.com/shorts/YoOXWUajbQc?feature=shared

Vuoi acquistare o tornare al menu?
`);
    }
  }

  if (intent === "video_main") {
    setState(uid, "video_main");
    return reply(res, `
🎥 Ecco il video della *Guida Completa all’Ecosistema Digitale Reale*:

https://youtube.com/shorts/YoOXWUajbQc?feature=shared

Vuoi acquistare la guida o tornare al menu?
`);
  }

  if (state.state === "video_main") {
    if (isYes(rawText)) {
      return reply(res, `
Ecco il link per acquistare:

${mainProduct ? mainProduct.LinkPayhip : LINKS.store}

Hai bisogno di altro o vuoi tornare al menu?
`);
    }
  }

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

  if (intent === "newsletter") {
    setState(uid, "newsletter");
    const t = normalize(rawText);

    if (t.includes("annulla") || t.includes("disiscriv")) {
      return reply(res, `
Per annullare l’iscrizione:

${LINKS.disiscrizione}

Vuoi tornare al menu?
`);
    }

    if (t.includes("iscriv")) {
      return reply(res, `
Perfetto! Puoi iscriverti qui:

${LINKS.newsletter}

Vuoi tornare al menu?
`);
    }

    return reply(res, `
Vuoi iscriverti o annullare l’iscrizione?

• "iscrivimi"  
• "annulla iscrizione"  
• "menu"
`);
  }

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

  if (intent === "cerca") {
    setState(uid, "cerca");
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
    out += "Vuoi dettagli su uno di questi prodotti o tornare al menu?";
    return reply(res, out);
  }

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

  return reply(res, `
Posso aiutarti con prodotti, supporto, newsletter o social.

Scrivi "menu" per vedere tutte le opzioni.
`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MewingMarket AI attivo sulla porta " + PORT);
});
