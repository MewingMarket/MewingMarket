// modules/bot.js

const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  findProductFromText,
  listProductsByCategory,
  productReply,
  productLongReply,
  productImageReply
} = require("./catalogo");

const { normalize } = require("./utils");
const { getProducts } = require("./airtable");

// ------------------------------
// 🔥 TRACKING BOT
// ------------------------------
function trackBot(event, data = {}) {
  try {
    if (global.trackEvent) {
      global.trackEvent(event, data);
    }
  } catch (e) {
    console.error("Tracking bot error:", e);
  }
}

// ------------------------------
// 🔥 GPT MAX
// ------------------------------
const SYSTEM_PROMPT = `
Sei l'assistente ufficiale di MewingMarket.
Tono: professionale, diretto, utile, commerciale quando serve.
Non inventare prodotti.
Non essere prolisso.
Se l’utente chiede consigli → consiglia.
Se chiede supporto → risolvi.
Se chiede confronto → confronta.
Se chiede idee → generane.
Se chiede riscrittura → riscrivi.
`;

async function callGPT(prompt, memory = {}, context = {}) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "assistant", content: "Memoria: " + JSON.stringify(memory) },
          { role: "assistant", content: "Contesto: " + JSON.stringify(context) },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "Non riesco a rispondere ora.";
  } catch (err) {
    console.error("GPT error:", err);
    return "Sto avendo un problema temporaneo. Riprova tra poco.";
  }
}

// ------------------------------
// STATO UTENTI
// ------------------------------
const userStates = {};

function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

function setState(uid, newState) {
  userStates[uid].state = newState;
}

function reply(res, text) {
  trackBot("bot_reply", { text });
  res.json({ reply: text });
}

function isYes(text) {
  const t = text.toLowerCase();
  return (
    t.includes("si") ||
    t.includes("sì") ||
    t.includes("ok") ||
    t.includes("va bene") ||
    t.includes("certo") ||
    t.includes("yes")
  );
}

// ------------------------------
// COSTANTI BOT (TUO CODICE)
// ------------------------------
const LINKS = {
  sito: "https://www.mewingmarket.it",
  store: "https://mewingmarket.payhip.com",
  newsletter: "https://mewingmarket.it/newsletter",
  disiscrizione: "https://mewingmarket.it/unsubscribe",

  instagram: "https://instagram.com/mewingmarket",
  tiktok: "https://tiktok.com/@mewingmarket",
  youtube: "https://youtube.com/@mewingmarket",
  facebook: "https://facebook.com/mewingmarket",
  x: "https://x.com/mewingmarket",
  threads: "https://threads.net/@mewingmarket",
  linkedin: "https://linkedin.com/company/mewingmarket"
};

const HELP_DESK = {
  download: "📥 *Problemi con il download?*\nControlla la tua email Payhip o la sezione 'I miei acquisti'. Se serve aiuto scrivi a supporto@mewingmarket.it o su WhatsApp 352 026 6660.",
  
  payhip: "💳 *Problemi con Payhip?*\nAssicurati che la carta sia abilitata agli acquisti online. Se il problema persiste, contattaci su WhatsApp 352 026 6660.",

  rimborso: "↩️ *Resi e Rimborsi*\nLeggi la politica completa qui:\nhttps://www.mewingmarket.it/resi.html\n\nPer assistenza:\n📩 supporto@mewingmarket.it\n💬 WhatsApp: 352 026 6660",

  contatto: "📞 *Contatti diretti*\nSupporto: supporto@mewingmarket.it\nCommerciale: vendite@mewingmarket.it\nWhatsApp: 352 026 6660"
};

const FAQ_BLOCK = `
❓ *Domande frequenti*

• Non ho ricevuto l’email  
• Il download non funziona  
• Problemi con Payhip  
• Voglio un rimborso  
• Voglio contattare il supporto
`;

const SUPPORTO = `
🛠 *Supporto tecnico*

Descrivi il problema e ti aiuto subito.
`;// ------------------------------------------------------
// DETECT INTENT — VERSIONE MAX (ORIGINALE + AGGIUNTE GPT)
// ------------------------------------------------------

function detectIntent(rawText) {
  const t = normalize(rawText);
  const PRODUCTS = getProducts();

  trackBot("intent_detect", { text: rawText });

  // ------------------------------
  // INTENT GPT AGGIUNTI
  // ------------------------------

  // Confronto prodotti
  if (
    t.includes("confronta") ||
    t.includes("differenza") ||
    t.includes("vs") ||
    t.includes("meglio tra")
  ) {
    return { intent: "compare", sub: null };
  }

  // Idee / brainstorming
  if (
    t.includes("idee") ||
    t.includes("ispirami") ||
    t.includes("dammi idee") ||
    t.includes("brainstorming")
  ) {
    return { intent: "ideas", sub: null };
  }

  // Riscrittura testi
  if (
    t.includes("riscrivi") ||
    t.includes("migliora questo testo") ||
    t.includes("riformula")
  ) {
    return { intent: "rewrite", sub: null };
  }

  // Spiegazioni
  if (
    t.includes("spiega") ||
    t.includes("cos è") ||
    t.includes("come funziona")
  ) {
    return { intent: "explain", sub: null };
  }

  // Consulenza commerciale avanzata
  if (
    t.includes("consulenza") ||
    t.includes("aiutami a scegliere") ||
    t.includes("non so cosa prendere")
  ) {
    return { intent: "advisor", sub: null };
  }

  // ------------------------------
  // TUO DETECT INTENT ORIGINALE
  // ------------------------------

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
    t.includes("restituzione") ||
    t.includes("resi") ||
    t.includes("reso") ||
    t.includes("politica resi") ||
    t.includes("res i") ||
    t.includes("pagina resi")
  ) {
    return { intent: "resi_pagina", sub: null };
  }

  // MATCH PRODOTTI
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

  // MATCH CATEGORIA
  for (const p of PRODUCTS) {
    const catNorm = normalize(p.categoria);
    if (catNorm && t.includes(catNorm)) {
      return { intent: "categoria", sub: p.categoria };
    }
  }

  // ------------------------------
  // FALLBACK GPT
  // ------------------------------
  if (t.length > 3) {
    return { intent: "gpt", sub: null };
  }

  return { intent: "fallback", sub: null };
}// ------------------------------------------------------
// HANDLE CONVERSATION — VERSIONE MAX
// ------------------------------------------------------

async function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const PRODUCTS = getProducts();

  // inizializza stato utente
  if (!userStates[uid]) {
    userStates[uid] = { state: "menu", lastIntent: null, data: {} };
  }

  const state = userStates[uid];
  state.lastIntent = intent;

  trackBot("conversation_step", { uid, intent, sub, text: rawText });

  // ------------------------------------------------------
  // 🔥 AGENTI GPT (nuovi intent)
  // ------------------------------------------------------

  // confronto prodotti
  if (intent === "compare") {
    const risposta = await callGPT(
      `Confronta prodotti MewingMarket in base a ciò che l'utente ha scritto: "${rawText}". 
       Se non sono chiari i prodotti, proponi tu i più rilevanti.`,
      state,
      {}
    );
    return reply(res, risposta);
  }

  // idee / brainstorming
  if (intent === "ideas") {
    const risposta = await callGPT(
      `Genera idee utili e pratiche per l'utente basate su: "${rawText}".`,
      state,
      {}
    );
    return reply(res, risposta);
  }

  // riscrittura testi
  if (intent === "rewrite") {
    const risposta = await callGPT(
      `Riscrivi e migliora questo testo mantenendo il senso originale:\n\n"${rawText}"`,
      state,
      {}
    );
    return reply(res, risposta);
  }

  // spiegazioni
  if (intent === "explain") {
    const risposta = await callGPT(
      `Spiega in modo semplice e concreto ciò che l'utente chiede:\n\n"${rawText}"`,
      state,
      {}
    );
    return reply(res, risposta);
  }

  // consulenza commerciale avanzata
  if (intent === "advisor") {
    const risposta = await callGPT(
      `Consiglia il prodotto o la combinazione di prodotti MewingMarket più adatti in base a:\n\n"${rawText}"`,
      state,
      {}
    );
    return reply(res, risposta);
  }

  // ------------------------------------------------------
  // 🔥 DA QUI IN POI — TUO CODICE ORIGINALE
  // ------------------------------------------------------

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
}// PROMOZIONI
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
      }// CONTATTI
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

  // VIDEO MAIN
  if (intent === "video_main") {
    setState(uid, "video_main");
    return reply(res, `
🎥 Ecco il video della *Guida Completa all’Ecosistema Digitale Reale*:

https://youtube.com/shorts/YoOXWUajbQc

Vuoi acquistare la guida o tornare al menu?
`);
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

  // 🔥 FALLBACK GPT
  if (intent === "gpt") {
    const risposta = await callGPT(rawText, state, {});
    return reply(res, risposta);
  }

  // FALLBACK FINALE
  return reply(res, `
Posso aiutarti con prodotti, supporto, newsletter o social.

Scrivi una parola chiave come:
• "catalogo"
• "supporto"
• "newsletter"
• "social"
`);
  }// ------------------------------------------------------
// EXPORT FINALE — BOT MAX COMPLETO
// ------------------------------------------------------

module.exports = {
  detectIntent,
  handleConversation,
  generateUID
};
