/* =========================================================
   IMPORT ORIGINALI
========================================================= */
const fetch = require("node-fetch");

const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  productReply,
  productLongReply
} = require("./catalogo");

const { normalize, cleanSearchQuery } = require("./utils");
const { getProducts } = require("./airtable");
const Context = require("./context");
const Memory = require("./memory");

/* =========================================================
   DEBUG ULTRA — ARCHIVIO LOG
========================================================= */
const BOT_DEBUG_LOG = global.BOT_DEBUG_LOG || [];
global.BOT_DEBUG_LOG = BOT_DEBUG_LOG;

function logBotDebug(entry) {
  BOT_DEBUG_LOG.push({
    time: new Date().toISOString(),
    ...entry
  });

  if (BOT_DEBUG_LOG.length > 5000) BOT_DEBUG_LOG.shift();
}

/* =========================================================
   DEBUG: LOG AVVIO FILE
========================================================= */
logBotDebug({
  step: "bot_file_loaded",
  data: { status: "OK" }
});

/* =========================================================
   UTM EXTRACTOR
========================================================= */
function extractUTM(req) {
  logBotDebug({
    step: "extract_utm_start",
    data: { body: req.body || null }
  });

  try {
    const utm = req.body?.utm || {};

    logBotDebug({
      step: "extract_utm_success",
      data: { utm }
    });

    return utm;
  } catch (err) {
    logBotDebug({
      step: "extract_utm_error",
      data: { error: err.message }
    });

    return {};
  }
}

/* =========================================================
   TRACKING WRAPPERS
========================================================= */
function trackBotEvent(event, data = {}) {
  logBotDebug({
    step: "track_event",
    data: { event, data }
  });

  try {
    if (global.trackEvent) {
      global.trackEvent("bot_" + event, data);
    }
  } catch (err) {
    console.error("Bot tracking error:", err);

    logBotDebug({
      step: "track_event_error",
      data: { error: err.message }
    });
  }
}

function trackBot(event, data = {}) {
  logBotDebug({
    step: "track_bot",
    data: { event, data }
  });

  try {
    if (global.trackEvent) {
      global.trackEvent(event, data);
    }
  } catch (e) {
    console.error("Tracking bot error:", e);

    logBotDebug({
      step: "track_bot_error",
      data: { error: e.message }
    });
  }
}

/* =========================================================
   SYSTEM PROMPT BASE
========================================================= */
const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket, integrato nel sito.
Tono: chiaro, diretto, professionale, amichevole.
Non inventare prodotti o prezzi. Consiglia solo ciò che esiste.
`;

logBotDebug({
  step: "system_prompt_loaded",
  data: { length: BASE_SYSTEM_PROMPT.length }
}); /* =========================================================
   GPT WRAPPER — DEBUG ULTRA
========================================================= */
async function callGPT(userPrompt, memory = [], context = {}, extraSystem = "", extraData = {}) {
  logBotDebug({
    step: "gpt_call_start",
    data: {
      userPrompt,
      memory_preview: memory.slice(-6),
      context,
      extraSystem,
      extraData
    }
  });

  try {
    const system = BASE_SYSTEM_PROMPT + (extraSystem || "");

    const payload = {
      model: "meta-llama/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: system },
        { role: "assistant", content: "Memoria recente: " + JSON.stringify(memory.slice(-6) || []) },
        { role: "assistant", content: "Contesto pagina: " + JSON.stringify(context || {}) },
        { role: "assistant", content: "Dati strutturati disponibili: " + JSON.stringify(extraData || {}) },
        { role: "user", content: userPrompt }
      ]
    };

    logBotDebug({
      step: "gpt_payload_ready",
      data: { payload }
    });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    logBotDebug({
      step: "gpt_raw_response",
      data: { json }
    });

    const out = json?.choices?.[0]?.message?.content?.trim();

    logBotDebug({
      step: "gpt_output",
      data: { out }
    });

    if (!out) return "Sono qui 👋 Dimmi pure come posso aiutarti.";
    return out;

  } catch (err) {
    console.error("GPT error:", err);

    logBotDebug({
      step: "gpt_error",
      data: { error: err.message }
    });

    return "Sto avendo un piccolo problema tecnico, ma ci sono 👍";
  }
}

/* =========================================================
   UID GENERATOR — DEBUG
========================================================= */
function generateUID() {
  const uid = "mm_" + Math.random().toString(36).substring(2, 12);

  logBotDebug({
    step: "generate_uid",
    data: { uid }
  });

  return uid;
}

/* =========================================================
   STATE MANAGER — DEBUG
========================================================= */
function setState(req, newState) {
  logBotDebug({
    step: "set_state",
    data: {
      oldState: req.userState?.state || null,
      newState
    }
  });

  if (req.userState && typeof req.userState === "object") {
    req.userState.state = newState;
  }
}

/* =========================================================
   REPLY WRAPPER — DEBUG ULTRA
========================================================= */
function reply(res, text, meta = {}) {
  logBotDebug({
    step: "reply_start",
    data: { text, meta }
  });

  try {
    trackBotEvent("reply", {
      reply: text,
      intent: meta.intent || null,
      sub: meta.sub || null,
      uid: meta.uid || null,
      utm: meta.utm || null,
      page: meta.page || null
    });
  } catch (e) {
    console.error("Bot reply tracking error:", e);

    logBotDebug({
      step: "reply_tracking_error",
      data: { error: e.message }
    });
  }

  logBotDebug({
    step: "reply_send",
    data: { text }
  });

  res.json({ reply: text });
    } /* =========================================================
   YES DETECTOR — DEBUG
========================================================= */
function isYes(text) {
  const t = (text || "").toLowerCase();

  logBotDebug({
    step: "is_yes_check",
    data: { text, normalized: t }
  });

  return (
    t.includes("si") ||
    t.includes("sì") ||
    t.includes("ok") ||
    t.includes("va bene") ||
    t.includes("certo") ||
    t.includes("yes")
  );
}

/* =========================================================
   BUILD PRODUCT INDEX — DEBUG ULTRA
========================================================= */
function buildProductIndex() {
  logBotDebug({
    step: "build_product_index_start",
    data: {}
  });

  const products = getProducts() || [];

  logBotDebug({
    step: "build_product_index_products_loaded",
    data: { count: products.length }
  });

  const indexed = products.map(p => {
    const titolo = (p.titolo || "").toLowerCase();
    const slug = (p.slug || "").toLowerCase();
    const synonyms = [];

    // Aggiunta sinonimi (logica originale)
    if (titolo.includes("ecosistema")) {
      synonyms.push("ecosistema","ecosistema digitale","eco sistema","ecosist","ecos","guida ecosistema","ecosistema reale");
    }

    if (titolo.includes("business") && titolo.includes("ai")) {
      synonyms.push("business ai","business digitale ai","business digitale","business 90 giorni","ai business","business plan ai");
    }

    if (titolo.includes("contenuti")) {
      synonyms.push("contenuti","content","creare contenuti","guida contenuti","contenuto","content creation");
    }

    if (titolo.includes("competenze")) {
      synonyms.push("competenze","analisi competenze","skill","analisi delle competenze","valutazione competenze");
    }

    if (titolo.includes("produttività") || titolo.includes("planner")) {
      synonyms.push("produttività","produttivita","planner ai","planner produttività","planner","produttività ai");
    }

    if (titolo.includes("business plan")) {
      synonyms.push("business plan","workbook business plan","plan","piano business","piano aziendale");
    }

    if (titolo.includes("fiscale") || titolo.includes("forfettario") || titolo.includes("flessinance")) {
      synonyms.push("forfettario","guida fiscale","fisco","flessinance","tasse","guida forfettario");
    }

    const out = { ...p, _index: { titolo, slug, synonyms } };

    logBotDebug({
      step: "build_product_index_item",
      data: out._index
    });

    return out;
  });

  logBotDebug({
    step: "build_product_index_complete",
    data: { count: indexed.length }
  });

  return indexed;
}

/* =========================================================
   TEXT INCLUDES ANY — DEBUG
========================================================= */
function textIncludesAny(text, arr) {
  const t = text.toLowerCase();

  const match = arr.some(k => t.includes(k.toLowerCase()));

  logBotDebug({
    step: "text_includes_any",
    data: { text, arr, match }
  });

  return match;
}

/* =========================================================
   FUZZY MATCH PRODUCT — DEBUG ULTRA
========================================================= */
function fuzzyMatchProduct(text) {
  logBotDebug({
    step: "fuzzy_match_start",
    data: { text }
  });

  const products = buildProductIndex();
  const t = (text || "").toLowerCase();

  // Match diretto slug/titolo
  for (const p of products) {
    if (t.includes(p._index.slug) || t.includes(p._index.titolo)) {
      logBotDebug({
        step: "fuzzy_match_direct_hit",
        data: { product: p.slug }
      });
      return p;
    }
  }

  // Match sinonimi
  for (const p of products) {
    if (textIncludesAny(t, p._index.synonyms)) {
      logBotDebug({
        step: "fuzzy_match_synonym_hit",
        data: { product: p.slug }
      });
      return p;
    }
  }

  // Match parole chiave
  const keywords = t.split(/\s+/).filter(w => w.length > 3);

  logBotDebug({
    step: "fuzzy_match_keywords",
    data: { keywords }
  });

  if (keywords.length) {
    for (const p of products) {
      if (keywords.some(k => p._index.titolo.includes(k))) {
        logBotDebug({
          step: "fuzzy_match_keyword_hit",
          data: { product: p.slug }
        });
        return p;
      }
    }
  }

  logBotDebug({
    step: "fuzzy_match_no_result",
    data: { text }
  });

  return null;
                    } /* =========================================================
   DETECT INTENT — DEBUG ULTRA
========================================================= */
function detectIntent(rawText) {
  logBotDebug({
    step: "detect_intent_start",
    data: { rawText }
  });

  const text = rawText || "";
  const t = normalize(text);
  const q = cleanSearchQuery(text);

  logBotDebug({
    step: "detect_intent_normalized",
    data: { t, q }
  });

  trackBot("intent_detect", { text: rawText });

  /* ============================
     Conversazione
  ============================ */
  if (
    q.includes("come va") ||
    q.includes("come stai") ||
    q.includes("tutto bene") ||
    q.includes("e te") ||
    q.includes("che fai") ||
    q.includes("parlami") ||
    q.includes("dimmi qualcosa") ||
    q.includes("sei vivo") ||
    q.includes("sei reale") ||
    q.includes("ciao") ||
    q.includes("hey") ||
    q.includes("buongiorno") ||
    q.includes("buonasera")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "conversazione" } });
    return { intent: "conversazione", sub: null };
  }

  /* ============================
     Menu
  ============================ */
  if (
    q.includes("menu") ||
    q.includes("inizio") ||
    q.includes("start") ||
    q.includes("opzioni") ||
    q.includes("help") ||
    q.includes("aiuto")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "menu" } });
    return { intent: "menu", sub: null };
  }

  /* ============================
     Catalogo
  ============================ */
  if (
    q.includes("catalogo") ||
    q.includes("prodotti") ||
    q.includes("store") ||
    q.includes("shop")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "catalogo" } });
    return { intent: "catalogo", sub: null };
  }

  /* ============================
     Newsletter
  ============================ */
  if (
    q.includes("iscrizione") ||
    q.includes("mi iscrivo") ||
    q.includes("voglio iscrivermi") ||
    q.includes("registrazione")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "newsletter", sub: "subscribe" } });
    return { intent: "newsletter", sub: "subscribe" };
  }

  if (
    q.includes("newsletter") ||
    q.includes("iscrivermi") ||
    q.includes("iscriviti") ||
    q.includes("disiscriv") ||
    q.includes("annulla iscrizione")
  ) {
    if (q.includes("disiscriv") || q.includes("annulla")) {
      logBotDebug({ step: "intent_match", data: { intent: "newsletter", sub: "unsubscribe" } });
      return { intent: "newsletter", sub: "unsubscribe" };
    }

    logBotDebug({ step: "intent_match", data: { intent: "newsletter", sub: "subscribe" } });
    return { intent: "newsletter", sub: "subscribe" };
  }

  /* ============================
     Social specifici
  ============================ */
  const socials = ["instagram","tiktok","youtube","facebook","threads","linkedin","x "];
  for (const s of socials) {
    if (q.includes(s)) {
      logBotDebug({ step: "intent_match", data: { intent: "social_specifico", sub: s.trim() } });
      return { intent: "social_specifico", sub: s.trim() };
    }
  }

  if (q.includes("social")) {
    logBotDebug({ step: "intent_match", data: { intent: "social" } });
    return { intent: "social", sub: null };
  }

  /* ============================
     Policy & Legal
  ============================ */
  if (q.includes("privacy") || q.includes("dati") || q.includes("gdpr")) {
    logBotDebug({ step: "intent_match", data: { intent: "privacy" } });
    return { intent: "privacy", sub: null };
  }

  if (q.includes("termini") || q.includes("condizioni") || q.includes("terms")) {
    logBotDebug({ step: "intent_match", data: { intent: "termini" } });
    return { intent: "termini", sub: null };
  }

  if (q.includes("cookie")) {
    logBotDebug({ step: "intent_match", data: { intent: "cookie" } });
    return { intent: "cookie", sub: null };
  }

  if (q.includes("resi") || q.includes("rimborsi") || q.includes("rimborso")) {
    logBotDebug({ step: "intent_match", data: { intent: "resi" } });
    return { intent: "resi", sub: null };
  }

  if (q.includes("faq")) {
    logBotDebug({ step: "intent_match", data: { intent: "faq" } });
    return { intent: "faq", sub: null };
  }

  /* ============================
     Contatti
  ============================ */
  if (
    q.includes("contatti") ||
    q.includes("contatto") ||
    q.includes("email") ||
    q.includes("whatsapp") ||
    q.includes("numero") ||
    q.includes("telefono")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "contatti" } });
    return { intent: "contatti", sub: null };
  }

  /* ============================
     Dove siamo
  ============================ */
  if (
    q.includes("dove siamo") ||
    q.includes("indirizzo") ||
    q.includes("sede")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "dovesiamo" } });
    return { intent: "dovesiamo", sub: null };
  }

  /* ============================
     Supporto
  ============================ */
  if (
    q.includes("supporto") ||
    q.includes("assistenza") ||
    q.includes("problema") ||
    q.includes("errore") ||
    q.includes("bug") ||
    q.includes("download") ||
    q.includes("payhip") ||
    q.includes("rimborso") ||
    q.includes("resi") ||
    q.includes("rimborsi")
  ) {
    let sub = null;

    if (q.includes("scaricare") || q.includes("download")) sub = "download";
    else if (q.includes("payhip")) sub = "payhip";
    else if (q.includes("rimborso") || q.includes("resi")) sub = "rimborso";
    else if (q.includes("email") || q.includes("contatto") || q.includes("contattare")) sub = "contatto";

    logBotDebug({ step: "intent_match", data: { intent: "supporto", sub } });
    return { intent: "supporto", sub };
  }

  /* ============================
     Acquisto diretto
  ============================ */
  if (
    q.includes("acquisto") ||
    q.includes("fare un acquisto") ||
    q.includes("voglio acquistare") ||
    q.includes("procedo all acquisto") ||
    q.includes("procedo all'acquisto") ||
    q.includes("acquista") ||
    q.includes("compra") ||
    q.includes("prendo") ||
    q.includes("lo prendo") ||
    q.includes("lo compro")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "acquisto_diretto" } });
    return { intent: "acquisto_diretto", sub: null };
  }

  /* ============================
     Dettagli prodotto
  ============================ */
  if (
    q.includes("dettagli") ||
    q.includes("approfondisci") ||
    q.includes("info") ||
    q.includes("informazioni") ||
    q.includes("spiegami meglio")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "dettagli_prodotto" } });
    return { intent: "dettagli_prodotto", sub: null };
  }

  /* ============================
     Video prodotto
  ============================ */
  if (
    q.includes("video") ||
    q.includes("anteprima") ||
    q.includes("presentazione")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "video_prodotto" } });
    return { intent: "video_prodotto", sub: null };
  }

  /* ============================
     Prezzo prodotto
  ============================ */
  if (
    q.includes("prezzo") ||
    q.includes("quanto costa") ||
    q.includes("costa") ||
    q.includes("costo")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "prezzo_prodotto" } });
    return { intent: "prezzo_prodotto", sub: null };
  }

  /* ============================
     Sconto / trattativa
  ============================ */
  if (
    q.includes("sconto") ||
    q.includes("sconti") ||
    q.includes("offerta") ||
    q.includes("promo")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "trattativa", sub: "sconto" } });
    return { intent: "trattativa", sub: "sconto" };
  }

  /* ============================
     Obiezione prezzo
  ============================ */
  if (
    q.includes("è caro") ||
    q.includes("troppo caro") ||
    q.includes("non so se vale") ||
    q.includes("non so se mi serve") ||
    q.includes("caro")
  ) {
    logBotDebug({ step: "intent_match", data: { intent: "obiezione", sub: "prezzo" } });
    return { intent: "obiezione", sub: "prezzo" };
  }

  /* ============================
     Ecosistema
  ============================ */
  if (q.includes("ecosistema") || q.includes("da dove inizio") || q.includes("iniziare")) {
    logBotDebug({ step: "intent_match", data: { intent: "ecosistema" } });
    return { intent: "ecosistema", sub: null };
  }

  /* ============================
     Mindset
  ============================ */
  if (q.includes("mindset") || q.includes("motivazione") || q.includes("mentalità")) {
    logBotDebug({ step: "intent_match", data: { intent: "mindset" } });
    return { intent: "mindset", sub: null };
  }

  /* ============================
     Lead magnet
  ============================ */
  if (q.includes("lead magnet") || q.includes("risorsa gratuita") || q.includes("freebie")) {
    logBotDebug({ step: "intent_match", data: { intent: "lead_magnet" } });
    return { intent: "lead_magnet", sub: null };
  }

  /* ============================
     FAQ premium
  ============================ */
  if (q.includes("faq premium") || q.includes("domande avanzate")) {
    logBotDebug({ step: "intent_match", data: { intent: "faq_premium" } });
    return { intent: "faq_premium", sub: null };
  }

  /* ============================
     Match prodotto fuzzy
  ============================ */
  const product = fuzzyMatchProduct(text);
  if (product) {
    logBotDebug({ step: "intent_match", data: { intent: "prodotto", sub: product.slug } });
    return { intent: "prodotto", sub: product.slug };
  }

  /* ============================
     Allegato
  ============================ */
  if (rawText.startsWith("FILE:")) {
    const file = rawText.replace("FILE:", "").trim();
    logBotDebug({ step: "intent_match", data: { intent: "allegato", sub: file } });
    return { intent: "allegato", sub: file };
  }

  /* ============================
     Input troppo breve
  ============================ */
  if (!rawText || rawText.trim().length < 2) {
    logBotDebug({ step: "intent_match", data: { intent: "menu" } });
    return { intent: "menu", sub: null };
  }

  /* ============================
     Input generico
  ============================ */
  const generic = ["ok","si","sì","eh","boh","yo","ciao","hey","hello"];
  if (generic.includes(rawText.toLowerCase().trim())) {
    logBotDebug({ step: "intent_match", data: { intent: "menu" } });
    return { intent: "menu", sub: null };
  }

  /* ============================
     Fallback GPT
  ============================ */
  logBotDebug({
    step: "intent_match",
    data: { intent: "gpt", sub: null }
  });

  return { intent: "gpt", sub: null };
    } /* =========================================================
   HANDLE CONVERSATION — DEBUG ULTRA (PARTE 1)
========================================================= */
async function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const state = req.userState || {};
  const PRODUCTS = getProducts() || [];

  logBotDebug({
    step: "conversation_start",
    data: { uid, intent, sub, rawText }
  });

  state.lastIntent = intent;
  Memory.push(uid, rawText || "");
  const pageContext = Context.get(uid);

  logBotDebug({
    step: "conversation_context_loaded",
    data: { pageContext }
  });

  const utm = extractUTM(req);

  logBotDebug({
    step: "conversation_utm",
    data: { utm }
  });

  trackBot("conversation_step", { uid, intent, sub, text: rawText });

  trackBotEvent("message", {
    uid,
    text: rawText,
    intent,
    sub,
    utm,
    page: pageContext?.page || null
  });

  /* =========================================================
     INTENT: GPT FALLBACK
  ========================================================== */
  if (intent === "gpt") {
    logBotDebug({
      step: "conversation_branch_gpt",
      data: {}
    });

    const risposta = await callGPT(rawText, Memory.get(uid), pageContext);

    return reply(res, risposta, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: CONVERSAZIONE
  ========================================================== */
  if (intent === "conversazione") {
    logBotDebug({
      step: "conversation_branch_conversazione",
      data: {}
    });

    const risposta = await callGPT(
      rawText,
      Memory.get(uid),
      pageContext,
      "\nRispondi in modo amichevole, breve, coerente con il brand MewingMarket, e collega la conversazione ai prodotti o al valore del digitale quando ha senso."
    );

    return reply(res, risposta, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: MENU
  ========================================================== */
  if (intent === "menu") {
    logBotDebug({
      step: "conversation_branch_menu",
      data: {}
    });

    setState(req, "menu");

    const base = `
Ciao 👋  
Sono il Copilot di MewingMarket.

Posso aiutarti a:
• scegliere il prodotto giusto  
• capire cosa fa ogni guida  
• risolvere problemi di download o pagamenti  
• gestire newsletter, contatti, social  
• chiarire dubbi su resi, privacy, termini  

Scrivi una parola chiave come:
"catalogo", "ecosistema", "business", "contenuti", "produttività", "supporto", "newsletter".
`;

    const enriched = await callGPT(
      rawText || "Mostra menu iniziale",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più umano e accogliente, senza cambiare la struttura."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: CATALOGO
  ========================================================== */
  if (intent === "catalogo") {
    logBotDebug({
      step: "conversation_branch_catalogo",
      data: { products_count: PRODUCTS.length }
    });

    setState(req, "catalogo");

    if (!PRODUCTS.length) {
      return reply(
        res,
        "Il catalogo sarà presto disponibile. Stiamo preparando i primi prodotti.",
        { intent, sub, uid, utm, page: pageContext?.page || null }
      );
    }

    let out = "📚 <b>Catalogo MewingMarket</b>\n\n";
    for (const p of PRODUCTS) {
      out += `• <b>${p.titoloBreve || p.titolo}</b> — ${p.prezzo}€  
<a href="${p.linkPayhip}">${p.linkPayhip}</a>\n\n`;
    }

    out += `Puoi scrivere il nome di un prodotto o il tuo obiettivo, e ti consiglio cosa scegliere.`;

    const enriched = await callGPT(
      rawText || "Mostra catalogo",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase finale che inviti a chiedere consiglio.",
      { products: PRODUCTS }
    );

    return reply(res, out + "\n\n" + (enriched || ""), {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: NEWSLETTER
  ========================================================== */
  if (intent === "newsletter") {
    logBotDebug({
      step: "conversation_branch_newsletter",
      data: { sub }
    });

    setState(req, "newsletter");

    /* -------------------------
       DISISCRIZIONE
    ------------------------- */
    if (sub === "unsubscribe") {
      const base = `
Vuoi annullare l'iscrizione alla newsletter?

Puoi farlo da qui:  
<a href="disiscriviti.html">disiscriviti.html</a>

Se hai problemi, scrivici:  
supporto@mewingmarket.it

Hai bisogno di altro o vuoi tornare al menu?
`;

      const enriched = await callGPT(
        rawText || "Disiscrizione newsletter",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più empatico ma chiaro."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    /* -------------------------
       ISCRIZIONE
    ------------------------- */
    const base = `
Vuoi iscriverti alla newsletter di MewingMarket?

Riceverai:  
• contenuti utili  
• aggiornamenti sui prodotti  
• novità e risorse pratiche  

Puoi iscriverti da qui:  
<a href="iscrizione.html">iscrizione.html</a>

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Iscrizione newsletter",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più accogliente e motivante."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
                 }  /* =========================================================
     INTENT: SOCIAL SPECIFICO
  ========================================================== */
  if (intent === "social_specifico") {
    logBotDebug({
      step: "conversation_branch_social_specifico",
      data: { sub }
    });

    const socials = {
      instagram: "https://www.instagram.com/mewingmarket",
      tiktok: "https://www.tiktok.com/@mewingmarket",
      youtube: "https://www.youtube.com/@mewingmarket2",
      facebook: "https://www.facebook.com/profile.php?id=61584779793628",
      x: "https://x.com/mewingm8",
      threads: "https://www.threads.net/@mewingmarket",
      linkedin: "https://www.linkedin.com/company/mewingmarket"
    };

    const link = socials[sub];

    const base = `
Ecco il nostro profilo ${sub.charAt(0).toUpperCase() + sub.slice(1)} 📲  
<a href="${link}">${link}</a>

Vuoi vedere anche gli altri social o tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Mostra social " + sub,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che spieghi cosa trova l’utente su questo social."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: SOCIAL GENERICO
  ========================================================== */
  if (intent === "social") {
    logBotDebug({
      step: "conversation_branch_social",
      data: {}
    });

    const base = `
Ecco i nostri social ufficiali 📲

Instagram: <a href="https://www.instagram.com/mewingmarket">Instagram</a>  
TikTok: <a href="https://www.tiktok.com/@mewingmarket">TikTok</a>  
YouTube: <a href="https://www.youtube.com/@mewingmarket2">YouTube</a>  
Facebook: <a href="https://www.facebook.com/profile.php?id=61584779793628">Facebook</a>  
X: <a href="https://x.com/mewingm8">X</a>  
Threads: <a href="https://www.threads.net/@mewingmarket">Threads</a>  
LinkedIn: <a href="https://www.linkedin.com/company/mewingmarket">LinkedIn</a>

Vuoi tornare al menu o vedere il catalogo?
`;

    const enriched = await callGPT(
      rawText || "Mostra social generici",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che inviti a seguire almeno un social."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: PRIVACY
  ========================================================== */
  if (intent === "privacy") {
    logBotDebug({
      step: "conversation_branch_privacy",
      data: {}
    });

    const base = `
La Privacy Policy di MewingMarket spiega come gestiamo i tuoi dati.

In sintesi:  
• raccogliamo nome e email per la newsletter  
• i dati di pagamento sono gestiti da Payhip  
• usiamo cookie tecnici e analytics  
• puoi chiedere accesso, modifica o cancellazione dei tuoi dati  

Pagina completa:  
<a href="privacy.html">privacy.html</a>

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Privacy policy",
      Memory.get(uid),
      pageContext,
      "\nRendi il tono più rassicurante."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: TERMINI E CONDIZIONI
  ========================================================== */
  if (intent === "termini") {
    logBotDebug({
      step: "conversation_branch_termini",
      data: {}
    });

    const base = `
I Termini e Condizioni spiegano come funziona MewingMarket.

In sintesi:  
• vendiamo prodotti digitali tramite Payhip  
• l'uso è personale  
• il download è immediato  
• i rimborsi sono valutati caso per caso  

Pagina completa:  
<a href="termini-e-condizioni.html">termini-e-condizioni.html</a>

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Termini e condizioni",
      Memory.get(uid),
      pageContext,
      "\nRendi il tono più umano."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: COOKIE
  ========================================================== */
  if (intent === "cookie") {
    logBotDebug({
      step: "conversation_branch_cookie",
      data: {}
    });

    const base = `
Usiamo cookie tecnici e analytics per migliorare il sito.

Pagina completa:  
<a href="cookie.html">cookie.html</a>

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Cookie policy",
      Memory.get(uid),
      pageContext,
      "\nNormalizza l'uso dei cookie senza banalizzare."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: RESI E RIMBORSI
  ========================================================== */
  if (intent === "resi") {
    logBotDebug({
      step: "conversation_branch_resi",
      data: {}
    });

    const base = `
I prodotti digitali non prevedono reso automatico, ma valutiamo ogni richiesta caso per caso.

Pagina completa:  
<a href="resi.html">resi.html</a>

Se hai un problema specifico, scrivici:  
supporto@mewingmarket.it  
WhatsApp: 352 026 6660

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Resi e rimborsi",
      Memory.get(uid),
      pageContext,
      "\nRendi il tono fermo ma comprensivo."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: FAQ
  ========================================================== */
  if (intent === "faq") {
    logBotDebug({
      step: "conversation_branch_faq",
      data: {}
    });

    const base = `
Puoi consultare le FAQ qui:  
<a href="FAQ.html">FAQ.html</a>

Se non trovi la risposta, scrivici:  
supporto@mewingmarket.it

Vuoi tornare al menu o hai bisogno di altro?
`;

    const enriched = await callGPT(
      rawText || "FAQ",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che inviti a chiedere se non trova la risposta."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: CONTATTI
  ========================================================== */
  if (intent === "contatti") {
    logBotDebug({
      step: "conversation_branch_contatti",
      data: {}
    });

    const base = `
Ecco i contatti ufficiali MewingMarket:

Vendite: vendite@mewingmarket.it  
Supporto: supporto@mewingmarket.it  
Email alternative: MewingMarket@outlook.it, mewingmarket2@gmail.com  
WhatsApp Business: 352 026 6660  

Pagina contatti:  
<a href="contatti.html">contatti.html</a>

Vuoi tornare al menu o vedere il catalogo?
`;

    const enriched = await callGPT(
      rawText || "Contatti",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che spieghi quando usare vendite e quando supporto."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: DOVE SIAMO
  ========================================================== */
  if (intent === "dovesiamo") {
    logBotDebug({
      step: "conversation_branch_dovesiamo",
      data: {}
    });

    const base = `
La sede di MewingMarket è:

Strada Ciousse 35  
18038 Sanremo (IM) — Italia  

Pagina:  
<a href="dovesiamo.html">dovesiamo.html</a>

Vuoi tornare al menu o hai bisogno di altro?
`;

    const enriched = await callGPT(
      rawText || "Dove siamo",
      Memory.get(uid),
      pageContext,
      "\nNormalizza il fatto che il progetto è digitale ma ha una base reale."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }  /* =========================================================
     INTENT: SUPPORTO
  ========================================================== */
  if (intent === "supporto") {
    logBotDebug({
      step: "conversation_branch_supporto",
      data: { sub }
    });

    setState(req, "supporto");

    /* -------------------------
       SUPPORTO: DOWNLOAD
    ------------------------- */
    if (sub === "download") {
      const base = `
Se non riesci a scaricare il prodotto:

1. Controlla la tua email (anche spam).  
2. Recupera il link da Payhip con la stessa email dell'acquisto.  
3. Prova un altro browser o dispositivo.  

Se non funziona:  
supporto@mewingmarket.it  
WhatsApp: 352 026 6660

Vuoi tornare al menu o hai bisogno di altro?
`;

      const enriched = await callGPT(
        rawText || "Supporto download",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più guidato e rassicurante."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    /* -------------------------
       SUPPORTO: PAYHIP
    ------------------------- */
    if (sub === "payhip") {
      const base = `
Payhip gestisce pagamenti e download.

Dopo il pagamento ricevi subito un’email con il link.  
Puoi accedere anche dalla tua area Payhip.

Se hai problemi:  
supporto@mewingmarket.it  
WhatsApp: 352 026 6660

Vuoi tornare al menu o hai bisogno di altro?
`;

      const enriched = await callGPT(
        rawText || "Supporto Payhip",
        Memory.get(uid),
        pageContext,
        "\nRendi il tono rassicurante."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    /* -------------------------
       SUPPORTO: RIMBORSO
    ------------------------- */
    if (sub === "rimborso") {
      const base = `
I prodotti digitali non prevedono reso automatico, ma valutiamo ogni caso.

Scrivici:  
supporto@mewingmarket.it  
WhatsApp: 352 026 6660  

Pagina:  
<a href="resi.html">resi.html</a>

Vuoi tornare al menu o hai bisogno di altro?
`;

      const enriched = await callGPT(
        rawText || "Supporto rimborso",
        Memory.get(uid),
        pageContext,
        "\nRendi il tono fermo ma gentile."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    /* -------------------------
       SUPPORTO: CONTATTO
    ------------------------- */
    if (sub === "contatto") {
      const base = `
Puoi contattare il supporto:

supporto@mewingmarket.it  
WhatsApp: 352 026 6660  

Siamo disponibili per:  
• problemi di download  
• informazioni sui prodotti  
• assistenza sugli acquisti  

Vuoi tornare al menu o hai bisogno di altro?
`;

      const enriched = await callGPT(
        rawText || "Supporto contatto",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a descrivere bene il problema."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    /* -------------------------
       SUPPORTO GENERICO
    ------------------------- */
    const base = `
Sono qui per aiutarti 💬  
Scrivi una parola chiave come:  
"download", "payhip", "rimborso", "contatto".
`;

    const enriched = await callGPT(
      rawText || "Supporto generico",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più naturale."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: ECOSISTEMA
  ========================================================== */
  if (intent === "ecosistema") {
    logBotDebug({
      step: "conversation_branch_ecosistema",
      data: {}
    });

    const base = `
L’Ecosistema Digitale è il punto di partenza ideale se vuoi:

• capire come funziona il digitale  
• evitare errori da principiante  
• avere una mappa chiara dei passi da fare  
• sapere quali strumenti usare e in che ordine  

Vuoi che ti dica se è adatto alla tua situazione?
`;

    const enriched = await callGPT(
      rawText || "Ecosistema Digitale",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più motivante e orientato all'azione."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: MINDSET
  ========================================================== */
  if (intent === "mindset") {
    logBotDebug({
      step: "conversation_branch_mindset",
      data: {}
    });

    const base = `
Il mindset è la base di tutto.

Se vuoi posso darti:
• una routine mentale semplice  
• un metodo per restare costante  
• un modo per evitare blocchi e procrastinazione  

Vuoi una routine veloce o un metodo completo?
`;

    const enriched = await callGPT(
      rawText || "Mindset",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più empatico e pratico."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: LEAD MAGNET
  ========================================================== */
  if (intent === "lead_magnet") {
    logBotDebug({
      step: "conversation_branch_lead_magnet",
      data: {}
    });

    const base = `
Ecco la risorsa gratuita per iniziare subito 👇  
https://mewingmarket.com/free

Vuoi che ti dica come usarla al meglio?
`;

    const enriched = await callGPT(
      rawText || "Lead magnet",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che inviti a usarla subito."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: FAQ PREMIUM
  ========================================================== */
  if (intent === "faq_premium") {
    logBotDebug({
      step: "conversation_branch_faq_premium",
      data: {}
    });

    const base = `
Ecco le FAQ avanzate:  
<a href="FAQ.html">FAQ Premium</a>

Vuoi che ti risponda direttamente a una domanda specifica?
`;

    const enriched = await callGPT(
      rawText || "FAQ Premium",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più orientato all’aiuto diretto."
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
    }  /* =========================================================
     INTENT: PRODOTTO
  ========================================================== */
  const lastProductSlug = state.lastProductSlug;

  if (intent === "prodotto") {
    logBotDebug({
      step: "conversation_branch_prodotto",
      data: { sub, lastProductSlug }
    });

    let product = null;

    if (sub) product = findProductBySlug(sub);
    if (!product) product = fuzzyMatchProduct(rawText);
    if (!product && normalize(rawText).includes("ecosistema")) {
      product = findProductBySlug(MAIN_PRODUCT_SLUG);
    }

    if (!product) {
      logBotDebug({
        step: "product_not_found",
        data: { rawText }
      });

      const base = `
Non ho capito bene quale prodotto ti interessa.

Scrivi il nome del prodotto o "catalogo".
`;

      const enriched = await callGPT(
        rawText || "Prodotto non chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più simile a una chat reale."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    logBotDebug({
      step: "product_found",
      data: { slug: product.slug, titolo: product.titolo }
    });

    state.lastProductSlug = product.slug;
    setState(req, "prodotto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    const base = productReply(product) + `

Vuoi:
• capire se è adatto a te  
• confrontarlo con altri  
• andare all’acquisto  
`;

    const enriched = await callGPT(
      rawText || "Prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase finale che aiuti a decidere.",
      { product }
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: ACQUISTO DIRETTO
  ========================================================== */
  if (intent === "acquisto_diretto") {
    logBotDebug({
      step: "conversation_branch_acquisto_diretto",
      data: { lastProductSlug }
    });

    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);

    if (!product) {
      logBotDebug({
        step: "acquisto_no_product",
        data: { rawText }
      });

      const base = `
Non ho capito quale prodotto vuoi acquistare.

Scrivi il nome del prodotto o "catalogo".
`;

      const enriched = await callGPT(
        rawText || "Acquisto senza prodotto chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più conversazionale."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    logBotDebug({
      step: "acquisto_product_found",
      data: { slug: product.slug, titolo: product.titolo }
    });

    state.lastProductSlug = product.slug;
    setState(req, "acquisto_diretto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    const base = `
Perfetto.

📘 <b>${product.titolo}</b>  
💰 <b>${product.prezzo}€</b>  

Acquisto diretto:  
<a href="${product.linkPayhip}">${product.linkPayhip}</a>

Dopo il pagamento ricevi subito il file.  
Vuoi un consiglio su come iniziare?
`;

    const enriched = await callGPT(
      rawText || "Acquisto diretto prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase finale che rinforzi il valore del prodotto.",
      { product }
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: DETTAGLI PRODOTTO
  ========================================================== */
  if (intent === "dettagli_prodotto") {
    logBotDebug({
      step: "conversation_branch_dettagli_prodotto",
      data: { lastProductSlug }
    });

    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);

    if (!product) {
      logBotDebug({
        step: "dettagli_no_product",
        data: { rawText }
      });

      const base = `
Dimmi il nome del prodotto di cui vuoi i dettagli  
(es. "Ecosistema Digitale", "Business Digitale AI", "Planner Produttività AI").
`;

      const enriched = await callGPT(
        rawText || "Dettagli prodotto senza nome chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più amichevole."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    logBotDebug({
      step: "dettagli_product_found",
      data: { slug: product.slug, titolo: product.titolo }
    });

    state.lastProductSlug = product.slug;
    setState(req, "dettagli_prodotto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    const base = productLongReply(product) + `

Vuoi:
• un confronto con altri prodotti  
• capire se è adatto alla tua situazione  
• andare all’acquisto  
`;

    const enriched = await callGPT(
      rawText || "Dettagli prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase finale che aiuti a decidere.",
      { product }
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: VIDEO PRODOTTO
  ========================================================== */
  if (intent === "video_prodotto") {
    logBotDebug({
      step: "conversation_branch_video_prodotto",
      data: { lastProductSlug }
    });

    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);

    if (!product) {
      logBotDebug({
        step: "video_no_product",
        data: { rawText }
      });

      const base = `
Non ho capito a quale prodotto ti riferisci per il video.

Scrivi:
• "video ecosistema"  
• "video business ai"  
• oppure il nome del prodotto.
`;

      const enriched = await callGPT(
        rawText || "Video prodotto senza nome chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più naturale."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    if (!product.youtube_url) {
      logBotDebug({
        step: "video_no_url",
        data: { slug: product.slug }
      });

      const base = `
Questo prodotto non ha un video ufficiale, ma posso spiegarti in modo chiaro cosa contiene e come usarlo.

Preferisci:
• spiegazione veloce  
• spiegazione completa  
`;

      const enriched = await callGPT(
        rawText || "Video non disponibile per " + product.titolo,
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più motivante.",
        { product }
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    logBotDebug({
      step: "video_product_found",
      data: { slug: product.slug, url: product.youtube_url }
    });

    state.lastProductSlug = product.slug;
    setState(req, "video_prodotto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    const base = `
🎥 <b>Video di presentazione di ${product.titolo}</b>  
<a href="${product.youtube_url}">${product.youtube_url}</a>

Vuoi un riassunto dei punti chiave?
`;

    const enriched = await callGPT(
      rawText || "Video prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che inviti a guardare il video con uno scopo preciso.",
      { product }
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: PREZZO PRODOTTO (INIZIO)
  ========================================================== */
  if (intent === "prezzo_prodotto") {
    logBotDebug({
      step: "conversation_branch_prezzo_prodotto",
      data: { lastProductSlug }
    });

    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);           if (!product) {
      logBotDebug({
        step: "prezzo_no_product",
        data: { rawText }
      });

      const base = `
Dimmi il nome del prodotto di cui vuoi sapere il prezzo  
(es. "Ecosistema Digitale", "Business Digitale AI", "Planner Produttività AI").
`;

      const enriched = await callGPT(
        rawText || "Prezzo prodotto senza nome chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più chiaro e diretto."
      );

      return reply(res, enriched || base, {
        intent,
        sub,
        uid,
        utm,
        page: pageContext?.page || null
      });
    }

    logBotDebug({
      step: "prezzo_product_found",
      data: { slug: product.slug, prezzo: product.prezzo }
    });

    state.lastProductSlug = product.slug;
    setState(req, "prezzo_prodotto");

    const base = `
💰 <b>Prezzo di ${product.titolo}</b>: ${product.prezzo}€

Vuoi:
• capire se è adatto a te  
• confrontarlo con altri  
• andare all’acquisto  
`;

    const enriched = await callGPT(
      rawText || "Prezzo prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che aiuti a capire il valore del prodotto.",
      { product }
    );

    return reply(res, enriched || base, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: OBIETTIONE PREZZO
  ========================================================== */
  if (intent === "obiezione" && sub === "prezzo") {
    logBotDebug({
      step: "conversation_branch_obiezione_prezzo",
      data: { lastProductSlug }
    });

    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);

    const enriched = await callGPT(
      rawText || "Obiezione prezzo",
      Memory.get(uid),
      pageContext,
      "\nRispondi con empatia, spiegando il valore del prodotto senza forzare l'acquisto."
    );

    return reply(res, enriched, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: TRATTATIVA / SCONTO
  ========================================================== */
  if (intent === "trattativa" && sub === "sconto") {
    logBotDebug({
      step: "conversation_branch_sconto",
      data: { lastProductSlug }
    });

    const enriched = await callGPT(
      rawText || "Richiesta sconto",
      Memory.get(uid),
      pageContext,
      "\nRispondi in modo elegante, spiegando che i prezzi sono già ottimizzati ma puoi aiutare a scegliere il prodotto giusto."
    );

    return reply(res, enriched, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     INTENT: ALLEGATO
  ========================================================== */
  if (intent === "allegato") {
    logBotDebug({
      step: "conversation_branch_allegato",
      data: { file: sub }
    });

    const enriched = await callGPT(
      rawText || "Allegato ricevuto",
      Memory.get(uid),
      pageContext,
      "\nRispondi come se avessi ricevuto un file, chiedendo cosa vuole farci."
    );

    return reply(res, enriched, {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }

  /* =========================================================
     FALLBACK FINALE (non dovrebbe mai attivarsi)
  ========================================================== */
  logBotDebug({
    step: "conversation_fallback_final",
    data: { rawText }
  });

  const fallback = await callGPT(
    rawText || "Fallback finale",
    Memory.get(uid),
    pageContext,
    "\nRispondi come assistente generale, mantenendo il tono MewingMarket."
  );

  return reply(res, fallback, {
    intent,
    sub,
    uid,
    utm,
    page: pageContext?.page || null
  });
  }  /* =========================================================
   CHIUSURA HANDLE CONVERSATION
========================================================= */
// (La funzione si chiude nel blocco precedente con il return finale)


/* =========================================================
   EXPORT FUNZIONI — DEBUG
========================================================= */
logBotDebug({
  step: "bot_exports_ready",
  data: {
    exported: [
      "detectIntent",
      "handleConversation",
      "reply",
      "generateUID",
      "setState",
      "isYes"
    ]
  }
});

module.exports = {
  detectIntent,
  handleConversation,
  reply,
  generateUID,
  setState,
  isYes
};

/* =========================================================
   FILE COMPLETATO
========================================================= */
logBotDebug({
  step: "bot_file_complete",
  data: { status: "OK" }
}); 
