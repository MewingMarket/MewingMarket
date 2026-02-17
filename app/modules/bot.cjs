/**
 * modules/bot.cjs — VERSIONE FULL PREMIUM + LOGGING TOTALE + PATCH GPT
 */

const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const fetch = require("node-fetch");

/* ============================================================
   LOG ENGINE — logging totale
   ============================================================ */
function log(section, data) {
  try {
    const formatted =
      typeof data === "object" ? JSON.stringify(data, null, 2) : data;
    console.log(`[MM-BOT][${section}]`, formatted);
  } catch (err) {
    console.error("[MM-BOT][LOG_ERROR]", err?.message || err);
  }
}

/* ============================================================
   IMPORT MODULI INTERNI
   ============================================================ */
const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  productReply,
  productLongReply,
  fuzzyMatchProduct
} = require(path.join(__dirname, "catalogo.cjs"));

const { normalize, cleanSearchQuery } = require(path.join(__dirname, "utils.cjs"));
const { getProducts } = require(path.join(__dirname, "airtable.cjs"));
const Context = require(path.join(__dirname, "context.cjs"));
const Memory = require(path.join(__dirname, "memory.cjs"));

/* ============================================================
   PREMIUM MODULES
   ============================================================ */
const Premium = require(path.join(__dirname, "premium", "index.cjs"));
log("INIT", "Premium modules loaded");

/* ============================================================
   TRACKING
   ============================================================ */
function trackBot(event, data = {}) {
  try {
    log("TRACK", { event, data });
    if (global.trackEvent && typeof global.trackEvent === "function") {
      global.trackEvent(event, data);
    }
  } catch (err) {
    console.error("Tracking bot error:", err?.message || err);
  }
}

/* ============================================================
   EMOJI BOOSTER
   ============================================================ */
function addEmojis(text = "") {
  log("EMOJI_IN", text);
  try {
    if (!text || typeof text !== "string") return text || "";
    const out = text
      .replace(/\bciao\b/gi, "ciao 👋")
      .replace(/\bgrazie\b/gi, "grazie 🙏")
      .replace(/\bok\b/gi, "ok 👍")
      .replace(/\bperfetto\b/gi, "perfetto 😎")
      .replace(/\bottimo\b/gi, "ottimo 🔥")
      .replace(/\bscusa\b/gi, "scusa 😅");

    log("EMOJI_OUT", out);
    return out;
  } catch (err) {
    log("EMOJI_ERROR", err);
    return text;
  }
}

/* ============================================================
   SYSTEM PROMPT GPT
   ============================================================ */
const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket.
Tono: chiaro, diretto, professionale, amichevole.
Regole: non inventare prodotti, non inventare prezzi.
Usa markup WhatsApp-style.
`;

/* ============================================================
   GPT CORE
   ============================================================ */
async function callGPT(
  userPrompt,
  memory = [],
  context = {},
  extraSystem = "",
  extraData = {}
) {
  log("GPT_CALL", { userPrompt, memory, context, extraSystem, extraData });

  try {
    const system = BASE_SYSTEM_PROMPT + (extraSystem || "");
    const safeMemory = Array.isArray(memory) ? memory.slice(-6) : [];

    const payload = {
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: system },
        { role: "assistant", content: "Memoria: " + JSON.stringify(safeMemory) },
        { role: "assistant", content: "Contesto: " + JSON.stringify(context) },
        { role: "assistant", content: "Dati: " + JSON.stringify(extraData) },
        { role: "user", content: userPrompt || "" }
      ]
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    const out = json?.choices?.[0]?.message?.content;

    if (out) return addEmojis(out.trim());

    return addEmojis("Sto avendo un piccolo rallentamento, ma posso aiutarti.");
  } catch (err) {
    log("GPT_ERROR", err);
    return addEmojis("C’è un piccolo problema tecnico, ma posso aiutarti.");
  }
}

/* ============================================================
   WHISPER
   ============================================================ */
async function transcribeAudio(filePath) {
  log("AUDIO_TRANSCRIBE_START", filePath);

  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return "Non riesco a leggere il file audio.";
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("model", "openai/whisper-1");

    const res = await axios.post(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      form,
      { headers: { ...form.getHeaders(), "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );

    return res.data?.text || "Non riesco a capire il vocale.";
  } catch (err) {
    log("AUDIO_TRANSCRIBE_FATAL", err);
    return "Il vocale non è chiaro.";
  }
}

/* ============================================================
   UTILS
   ============================================================ */
function generateUID() {
  const uid = "mm_" + Math.random().toString(36).substring(2, 12);
  log("UID_GENERATED", uid);
  return uid;
}

function setState(req, newState) {
  try {
    const old = req?.userState?.state || "none";
    log("STATE_CHANGE", { old, new: newState });
    if (req.userState) req.userState.state = newState;
  } catch (err) {
    log("STATE_ERROR", err);
  }
}

function reply(res, text) {
  try {
    log("BOT_REPLY", text);
    res.json({ reply: addEmojis(text || "") });
  } catch (err) {
    res.json({ reply: "Errore tecnico, ma posso aiutarti." });
  }
}

function isYes(text) {
  const t = (text || "").toLowerCase();
  return (
    t.includes("si") ||
    t.includes("sì") ||
    t.includes("ok") ||
    t.includes("va bene") ||
    t.includes("certo") ||
    t.includes("yes")
  );
} /* ============================================================
   DETECT INTENT — LOGGING TOTALE
   ============================================================ */
function detectIntent(rawText) {
  log("INTENT_RAW_TEXT", rawText);

  try {
    const text = rawText || "";
    const t = normalize(text);
    const q = cleanSearchQuery(text);

    log("INTENT_NORMALIZED", { t, q });
    trackBot("intent_detect", { text: rawText });

    // Conversazione generale
    if (
      q.includes("ciao") ||
      q.includes("hey") ||
      q.includes("come va") ||
      q.includes("come stai") ||
      q.includes("tutto bene") ||
      q.includes("parlami") ||
      q.includes("dimmi qualcosa")
    ) {
      return { intent: "conversazione", sub: null };
    }

    // Menu
    if (
      q.includes("menu") ||
      q.includes("inizio") ||
      q.includes("start") ||
      q.includes("opzioni") ||
      q.includes("aiuto")
    ) {
      return { intent: "menu", sub: null };
    }

    // Catalogo
    if (
      q.includes("catalogo") ||
      q.includes("prodotti") ||
      q.includes("store") ||
      q.includes("shop")
    ) {
      return { intent: "catalogo", sub: null };
    }

    // Newsletter
    if (q.includes("disiscriv")) {
      return { intent: "newsletter", sub: "unsubscribe" };
    }
    if (q.includes("newsletter") || q.includes("iscrizione")) {
      return { intent: "newsletter", sub: "subscribe" };
    }

    // Social specifici
    if (q.includes("instagram")) return { intent: "social_specifico", sub: "instagram" };
    if (q.includes("tiktok")) return { intent: "social_specifico", sub: "tiktok" };
    if (q.includes("youtube")) return { intent: "social_specifico", sub: "youtube" };
    if (q.includes("facebook")) return { intent: "social_specifico", sub: "facebook" };
    if (q.includes("threads")) return { intent: "social_specifico", sub: "threads" };
    if (q.includes("linkedin")) return { intent: "social_specifico", sub: "linkedin" };
    if (q === "x" || q.includes(" x ")) return { intent: "social_specifico", sub: "x" };

    // Social generico
    if (q.includes("social")) return { intent: "social", sub: null };

    // Privacy / Termini / Cookie
    if (q.includes("privacy")) return { intent: "privacy", sub: null };
    if (q.includes("termini") || q.includes("condizioni")) return { intent: "termini", sub: null };
    if (q.includes("cookie")) return { intent: "cookie", sub: null };

    // Resi
    if (q.includes("resi") || q.includes("rimborso")) return { intent: "resi", sub: null };

    // FAQ
    if (q.includes("faq")) return { intent: "faq", sub: null };

    // Contatti
    if (
      q.includes("contatti") ||
      q.includes("contatto") ||
      q.includes("email") ||
      q.includes("whatsapp") ||
      q.includes("telefono")
    ) {
      return { intent: "contatti", sub: null };
    }

    // Dove siamo
    if (q.includes("dove siamo") || q.includes("indirizzo") || q.includes("sede")) {
      return { intent: "dovesiamo", sub: null };
    }

    // Supporto
    if (q.includes("supporto") || q.includes("assistenza") || q.includes("problema")) {
      if (q.includes("download")) return { intent: "supporto", sub: "download" };
      if (q.includes("payhip")) return { intent: "supporto", sub: "payhip" };
      if (q.includes("rimborso")) return { intent: "supporto", sub: "rimborso" };
      if (q.includes("contatto") || q.includes("email")) return { intent: "supporto", sub: "contatto" };
      return { intent: "supporto", sub: null };
    }

    // Acquisto diretto
    if (
      q.includes("acquisto") ||
      q.includes("compra") ||
      q.includes("prendo") ||
      q.includes("lo compro")
    ) {
      return { intent: "acquisto_diretto", sub: null };
    }

    // Dettagli prodotto
    if (
      q.includes("dettagli") ||
      q.includes("approfondisci") ||
      q.includes("informazioni")
    ) {
      return { intent: "dettagli_prodotto", sub: null };
    }

    // Video prodotto
    if (q.includes("video")) return { intent: "video_prodotto", sub: null };

    // Prezzo prodotto
    if (q.includes("prezzo") || q.includes("quanto costa")) {
      return { intent: "prezzo_prodotto", sub: null };
    }

    // Trattativa
    if (q.includes("sconto") || q.includes("promo")) {
      return { intent: "trattativa", sub: null };
    }

    // Obiezione
    if (q.includes("caro") || q.includes("vale la pena")) {
      return { intent: "obiezione", sub: null };
    }

    // Allegati
    if (rawText && rawText.startsWith("FILE:")) {
      return { intent: "allegato", sub: rawText.replace("FILE:", "").trim() };
    }

    // Match prodotto fuzzy
    const product = fuzzyMatchProduct(text);
    if (product) return { intent: "prodotto", sub: product.slug };

    // Fallback GPT
    return { intent: "gpt", sub: null };

  } catch (err) {
    log("INTENT_FATAL_ERROR", err);
    return { intent: "gpt", sub: null };
  }
  } /* ============================================================
   HANDLE CONVERSATION — BLOCCO PRINCIPALE
   ============================================================ */
async function handleConversation(req, res, intent, sub, rawText) {
  log("HANDLE_START", { intent, sub, rawText });

  try {
    const uid = req?.uid || "unknown_user";
    const state = req?.userState || {};
    const pageContext = Context.get(req) || {};

    log("HANDLE_UID", uid);
    log("HANDLE_STATE_BEFORE", state);

    // Carica prodotti
    const PRODUCTS = (() => {
      try {
        const list = getProducts() || [];
        log("PRODUCTS_LOADED", { count: list.length });
        return list;
      } catch (err) {
        log("PRODUCTS_ERROR", err);
        return [];
      }
    })();

    // Memoria
    try {
      state.lastIntent = intent;
      Memory.push(uid, rawText || "");
      log("MEMORY_PUSH", rawText);
    } catch (err) {
      log("MEMORY_ERROR", err);
    }

    /* ------------------------------------------
       CONVERSAZIONE GENERICA
       ------------------------------------------ */
    if (intent === "conversazione") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Ciao 👋</div>
  <div class="mm-card-body">
    Sono qui per aiutarti con prodotti, supporto e consigli.<br><br>
    Vuoi vedere il <b>menu</b> o il <b>catalogo</b>?
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Conversazione",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più naturale e accogliente."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       MENU
       ------------------------------------------ */
    if (intent === "menu") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Menu principale</div>
  <div class="mm-card-body">
    • Catalogo<br>
    • Supporto<br>
    • Contatti<br>
    • Newsletter<br>
    • Social<br><br>
    Scrivi una di queste parole.
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Menu",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più guidato."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       CATALOGO
       ------------------------------------------ */
    if (intent === "catalogo") {
      if (!PRODUCTS.length) {
        return reply(res, "Il catalogo sarà presto disponibile.");
      }

      let out = `
<div class="mm-card">
  <div class="mm-card-title">📚 Catalogo MewingMarket</div>
  <div class="mm-card-body">
`;

      for (const p of PRODUCTS) {
        out += `
• <b>${p.titoloBreve || p.titolo}</b> — ${p.prezzo}€<br>
<a href="${p.linkPayhip}">${p.linkPayhip}</a><br><br>
`;
      }

      out += `
  </div>
</div>

<div class="mm-info">
Scrivi il nome di un prodotto o il tuo obiettivo.
</div>
`;

      const enriched = await callGPT(
        rawText || "Mostra catalogo",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase finale che inviti a chiedere consiglio.",
        { products: PRODUCTS }
      );

      return reply(res, out + (enriched || ""));
    }

    /* ------------------------------------------
       NEWSLETTER
       ------------------------------------------ */
    if (intent === "newsletter") {
      if (sub === "unsubscribe") {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Annulla iscrizione</div>
  <div class="mm-card-body">
    Puoi annullare l'iscrizione qui:<br>
    <a href="disiscriviti.html">disiscriviti.html</a><br><br>
    Se hai problemi: supporto@mewingmarket.it
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Disiscrizione newsletter",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più empatico."
        );

        return reply(res, enriched || base);
      }

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Iscriviti alla newsletter</div>
  <div class="mm-card-body">
    Riceverai contenuti utili, aggiornamenti e risorse pratiche.<br><br>
    <a href="iscrizione.html">iscrizione.html</a>
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Iscrizione newsletter",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più motivante."
      );

      return reply(res, enriched || base);
    } /* ------------------------------------------
       SOCIAL SPECIFICO
       ------------------------------------------ */
    if (intent === "social_specifico") {
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

      if (!link) {
        return reply(res, "Non trovo questo social, vuoi vedere la lista completa?");
      }

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Profilo ${sub}</div>
  <div class="mm-card-body">
    <a href="${link}">${link}</a><br><br>
    Vuoi vedere anche gli altri social?
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Mostra social " + sub,
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che spieghi cosa trova l’utente su questo social."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       SOCIAL GENERICO
       ------------------------------------------ */
    if (intent === "social") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">I nostri social 📲</div>
  <div class="mm-card-body">
    Instagram<br>
    TikTok<br>
    YouTube<br>
    Facebook<br>
    X<br>
    Threads<br>
    LinkedIn<br><br>
    Vuoi tornare al menu o vedere il catalogo?
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Mostra social generici",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a seguirci."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       PRIVACY
       ------------------------------------------ */
    if (intent === "privacy") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Privacy Policy</div>
  <div class="mm-card-body">
    In sintesi:<br>
    • raccogliamo nome e email per la newsletter<br>
    • i pagamenti sono gestiti da Payhip<br>
    • puoi chiedere modifica o cancellazione dei dati<br><br>
    Pagina completa:<br>
    <a href="privacy.html">privacy.html</a>
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Privacy policy",
        Memory.get(uid),
        pageContext,
        "\nRendi il tono più rassicurante."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       TERMINI E CONDIZIONI
       ------------------------------------------ */
    if (intent === "termini") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Termini e Condizioni</div>
  <div class="mm-card-body">
    In sintesi:<br>
    • vendiamo prodotti digitali tramite Payhip<br>
    • l'uso è personale<br>
    • il download è immediato<br><br>
    Pagina completa:<br>
    <a href="termini-e-condizioni.html">termini-e-condizioni.html</a>
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Termini e condizioni",
        Memory.get(uid),
        pageContext,
        "\nRendi il tono più umano."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       COOKIE
       ------------------------------------------ */
    if (intent === "cookie") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Cookie</div>
  <div class="mm-card-body">
    Usiamo cookie tecnici e analytics per migliorare il sito.<br><br>
    Pagina completa:<br>
    <a href="cookie.html">cookie.html</a>
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Cookie policy",
        Memory.get(uid),
        pageContext,
        "\nNormalizza l'uso dei cookie senza banalizzare."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       RESI E RIMBORSI
       ------------------------------------------ */
    if (intent === "resi") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Resi e rimborsi</div>
  <div class="mm-card-body">
    I prodotti digitali non prevedono reso automatico,<br>
    ma valutiamo ogni richiesta caso per caso.<br><br>
    Pagina completa:<br>
    <a href="resi.html">resi.html</a><br><br>
    supporto@mewingmarket.it<br>
    WhatsApp: 352 026 6660
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Resi e rimborsi",
        Memory.get(uid),
        pageContext,
        "\nRendi il tono fermo ma comprensivo."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       FAQ
       ------------------------------------------ */
    if (intent === "faq") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">FAQ</div>
  <div class="mm-card-body">
    Puoi consultare le FAQ qui:<br>
    <a href="FAQ.html">FAQ.html</a><br><br>
    Se non trovi la risposta, scrivimi pure.
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "FAQ",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a chiedere se non trova la risposta."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       CONTATTI
       ------------------------------------------ */
    if (intent === "contatti") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Contatti ufficiali</div>
  <div class="mm-card-body">
    Vendite: vendite@mewingmarket.it<br>
    Supporto: supporto@mewingmarket.it<br>
    WhatsApp: 352 026 6660<br><br>
    Pagina contatti:<br>
    <a href="contatti.html">contatti.html</a>
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Contatti",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che spieghi quando usare vendite e quando supporto."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       DOVE SIAMO
       ------------------------------------------ */
    if (intent === "dovesiamo") {
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Dove siamo</div>
  <div class="mm-card-body">
    Strada Ciousse 35<br>
    18038 Sanremo (IM)<br><br>
    Pagina:<br>
    <a href="dovesiamo.html">dovesiamo.html</a><br><br>
    Il progetto è digitale, ma ha una base reale.
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Dove siamo",
        Memory.get(uid),
        pageContext,
        "\nNormalizza il fatto che il progetto è digitale ma ha una base reale."
      );

      return reply(res, enriched || base);
    }  /* ------------------------------------------
       SUPPORTO
       ------------------------------------------ */
    if (intent === "supporto") {
      setState(req, "supporto");

      /* --- SUPPORTO DOWNLOAD --- */
      if (sub === "download") {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Problemi di download?</div>
  <div class="mm-card-body">
    1. Controlla la tua email (anche spam).<br>
    2. Recupera il link da Payhip con la stessa email dell'acquisto.<br>
    3. Prova un altro browser o dispositivo.<br><br>
    FAQ utili:<br>
    <a href="FAQ.html">FAQ.html</a><br><br>
    Se non funziona:<br>
    supporto@mewingmarket.it<br>
    WhatsApp: 352 026 6660
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Supporto download",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più guidato e rassicurante."
        );

        return reply(res, enriched || base);
      }

      /* --- SUPPORTO PAYHIP --- */
      if (sub === "payhip") {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Supporto Payhip</div>
  <div class="mm-card-body">
    Payhip gestisce pagamenti e download.<br><br>
    Dopo il pagamento ricevi subito un’email con il link.<br>
    Puoi accedere anche dalla tua area Payhip.<br><br>
    FAQ utili:<br>
    <a href="FAQ.html">FAQ.html</a><br><br>
    Se hai problemi:<br>
    supporto@mewingmarket.it<br>
    WhatsApp: 352 026 6660
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Supporto Payhip",
          Memory.get(uid),
          pageContext,
          "\nRendi il tono rassicurante."
        );

        return reply(res, enriched || base);
      }

      /* --- SUPPORTO RIMBORSO --- */
      if (sub === "rimborso") {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Richiesta rimborso</div>
  <div class="mm-card-body">
    FAQ utili:<br>
    <a href="FAQ.html">FAQ.html</a><br><br>
    Scrivici:<br>
    supporto@mewingmarket.it<br>
    WhatsApp: 352 026 6660<br><br>
    Pagina:<br>
    <a href="resi.html">resi.html</a>
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Supporto rimborso",
          Memory.get(uid),
          pageContext,
          "\nRendi il tono fermo ma gentile."
        );

        return reply(res, enriched || base);
      }

      /* --- SUPPORTO CONTATTO --- */
      if (sub === "contatto") {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Contatta il supporto</div>
  <div class="mm-card-body">
    supporto@mewingmarket.it<br>
    WhatsApp: 352 026 6660<br><br>
    FAQ utili:<br>
    <a href="FAQ.html">FAQ.html</a><br><br>
    Siamo disponibili per:<br>
    • problemi di download<br>
    • informazioni sui prodotti<br>
    • assistenza sugli acquisti
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Supporto contatto",
          Memory.get(uid),
          pageContext,
          "\nAggiungi una frase che inviti a descrivere bene il problema."
        );

        return reply(res, enriched || base);
      }

      /* --- SUPPORTO GENERICO --- */
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Supporto</div>
  <div class="mm-card-body">
    Scrivi una parola chiave come:<br>
    <b>download</b>, <b>payhip</b>, <b>rimborso</b>, <b>contatto</b>.<br><br>
    FAQ utili:<br>
    <a href="FAQ.html">FAQ.html</a>
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Supporto generico",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più naturale."
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       PRODOTTO
       ------------------------------------------ */
    const lastProductSlug = state?.lastProductSlug || null;

    if (intent === "prodotto") {
      let product = null;

      try {
        if (sub) product = findProductBySlug(sub);
        if (!product) product = fuzzyMatchProduct(rawText || "");
        if (!product && normalize(rawText || "").includes("ecosistema")) {
          product = findProductBySlug(MAIN_PRODUCT_SLUG);
        }
      } catch (err) {
        log("PRODUCT_MATCH_ERROR", err);
      }

      if (!product) {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Prodotto non chiaro</div>
  <div class="mm-card-body">
    Non ho capito bene quale prodotto ti interessa.<br><br>
    Scrivi il nome del prodotto o <b>catalogo</b>.
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Prodotto non chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più simile a una chat reale."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "prodotto");

      const base = `
${Premium.Cards.productCard(product)}

<div class="mm-quick-container">
  ${Premium.Quick.options([
    "È adatto a me?",
    "Confrontalo con altri",
    "Vai all’acquisto"
  ])}
</div>
`;

      const enriched = await callGPT(
        rawText || "Prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase finale che aiuti a fare il passo successivo.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       ACQUISTO DIRETTO
       ------------------------------------------ */
    if (intent === "acquisto_diretto") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (err) {
        log("ACQUISTO_MATCH_ERROR", err);
      }

      if (!product) {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Quale prodotto vuoi acquistare?</div>
  <div class="mm-card-body">
    Non ho capito quale prodotto vuoi acquistare.<br><br>
    Scrivi il nome del prodotto o <b>catalogo</b>.
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Acquisto senza prodotto chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più conversazionale."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "acquisto_diretto");

      const base = `
${Premium.Cards.checkoutCard(product)}

<div class="mm-info">
Dopo il pagamento ricevi subito il file.<br>
Vuoi un consiglio su come iniziare?
</div>
`;

      const enriched = await callGPT(
        rawText || "Acquisto diretto prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase finale che rinforzi il valore del prodotto.",
        { product }
      );

      return reply(res, enriched || base);
           }  /* ------------------------------------------
       DETTAGLI PRODOTTO
       ------------------------------------------ */
    if (intent === "dettagli_prodotto") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) {
          product = findProductBySlug(lastProductSlug);
        }
      } catch (err) {
        log("DETTAGLI_MATCH_ERROR", err);
      }

      if (!product) {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Dettagli prodotto</div>
  <div class="mm-card-body">
    Dimmi il nome del prodotto di cui vuoi i dettagli.<br><br>
    (es. "Ecosistema Digitale", "Business Digitale AI", "Planner Produttività AI")
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Dettagli prodotto senza nome chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più amichevole."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "dettagli_prodotto");

      const base = `
${Premium.Rich.productDetails(product)}

<div class="mm-quick-container">
  ${Premium.Quick.options([
    "Confrontalo con altri",
    "È adatto a me?",
    "Vai all’acquisto"
  ])}
</div>
`;

      const enriched = await callGPT(
        rawText || "Dettagli prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase finale che aiuti a decidere.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       VIDEO PRODOTTO
       ------------------------------------------ */
    if (intent === "video_prodotto") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) {
          product = findProductBySlug(lastProductSlug);
        }
      } catch (err) {
        log("VIDEO_MATCH_ERROR", err);
      }

      if (!product) {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Video prodotto</div>
  <div class="mm-card-body">
    Dimmi il nome del prodotto di cui vuoi vedere il video.
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Video prodotto senza nome chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più naturale."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "video_prodotto");

      if (!product.youtube_url) {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Nessun video disponibile</div>
  <div class="mm-card-body">
    Questo prodotto non ha un video di presentazione,<br>
    ma posso spiegartelo in modo chiaro.<br><br>
    Vuoi una spiegazione dettagliata?
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Prodotto senza video",
          Memory.get(uid),
          pageContext,
          "\nAggiungi una frase che inviti a chiedere dettagli."
        );

        return reply(res, enriched || base);
      }

      const base = `
<div class="mm-card">
  <div class="mm-card-title">🎥 Video di presentazione</div>
  <div class="mm-card-body">
    <a href="${product.youtube_url}">${product.youtube_url}</a><br><br>
    Vuoi un riassunto del video o i dettagli del prodotto?
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Video prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che aiuti a capire il valore del video.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       PREZZO PRODOTTO
       ------------------------------------------ */
    if (intent === "prezzo_prodotto") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) {
          product = findProductBySlug(lastProductSlug);
        }
      } catch (err) {
        log("PREZZO_MATCH_ERROR", err);
      }

      if (!product) {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Prezzo prodotto</div>
  <div class="mm-card-body">
    Dimmi il nome del prodotto di cui vuoi sapere il prezzo.
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Prezzo prodotto senza nome chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più amichevole."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "prezzo_prodotto");

      const base = `
${Premium.Cards.priceCard(product)}

<div class="mm-quick-container">
  ${Premium.Quick.options([
    "È adatto a me?",
    "Vedi dettagli",
    "Vai all’acquisto"
  ])}
</div>
`;

      const enriched = await callGPT(
        rawText || "Prezzo prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che spieghi perché il prezzo è giustificato.",
        { product }
      );

      return reply(res, enriched || base);
     }  /* ------------------------------------------
       TRATTATIVA / SCONTO
       ------------------------------------------ */
    if (intent === "trattativa") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) {
          product = findProductBySlug(lastProductSlug);
        }
      } catch (err) {
        log("TRATTATIVA_MATCH_ERROR", err);
      }

      if (!product) {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Vuoi uno sconto?</div>
  <div class="mm-card-body">
    Dimmi il nome del prodotto.
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Sconto senza prodotto chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più simpatico."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "trattativa");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Nessuno sconto attivo 😄</div>
  <div class="mm-card-body">
    Al momento non ci sono sconti su <b>${product.titolo}</b>,<br>
    ma posso aiutarti a capire se è davvero quello che ti serve.<br><br>
    Vuoi:<br>
    • una valutazione personalizzata<br>
    • un confronto con altri prodotti<br>
    • capire se è adatto al tuo caso
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Richiesta sconto prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più empatico e orientato al valore.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       OBIEZIONI SUL PREZZO
       ------------------------------------------ */
    if (intent === "obiezione") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) {
          product = findProductBySlug(lastProductSlug);
        }
      } catch (err) {
        log("OBIEZIONE_MATCH_ERROR", err);
      }

      if (!product) {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Obiezione sul prezzo</div>
  <div class="mm-card-body">
    Dimmi il nome del prodotto che ti sembra caro,<br>
    così ti spiego meglio cosa include.
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Obiezione senza prodotto chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più rassicurante."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "obiezione");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Capisco perfettamente 😌</div>
  <div class="mm-card-body">
    <b>${product.titolo}</b> non è un semplice PDF:<br>
    è un percorso strutturato che ti fa risparmiare settimane di tentativi.<br><br>
    Vuoi che ti spieghi:<br>
    • cosa include esattamente<br>
    • perché molte persone lo trovano utile<br>
    • se è davvero adatto al tuo caso
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Obiezione prezzo prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più rassicurante e orientato al valore.",
        { product }
      );

      return reply(res, enriched || base);
    }  /* ------------------------------------------
       ALLEGATI (FILE)
       ------------------------------------------ */
    if (intent === "allegato") {
      const filename = sub;

      const base = `
<div class="mm-card">
  <div class="mm-card-title">File ricevuto 📎</div>
  <div class="mm-card-body">
    Ho ricevuto il file: <b>${filename}</b>.<br><br>
    Vuoi che lo analizzi o che ti dica cosa farne?
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "File ricevuto: " + filename,
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a spiegare cosa vuole fare con il file.",
        { filename }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       FALLBACK FINALE GPT
       ------------------------------------------ */
    log("HANDLE_BRANCH", "fallback_finale");

    const fallback = await callGPT(
      rawText || "Fallback",
      Memory.get(uid),
      pageContext,
      "\nRispondi come un assistente commerciale del sito, chiaro e utile."
    );

    return reply(res, fallback || "Dimmi pure come posso aiutarti.");
  } catch (err) {
    log("HANDLE_FATAL_ERROR", err);

    return reply(
      res,
      "C’è stato un piccolo problema tecnico, ma sono qui. Dimmi pure cosa vuoi fare."
    );
  }
} /* ============================================================
   EXPORT — BLINDATO + LOGGING
   ============================================================ */
log("EXPORT_INIT", "Preparing module.exports");

module.exports = {
  detectIntent,
  handleConversation,
  reply,
  generateUID,
  transcribeAudio,
  addEmojis,
  fuzzyMatchProduct
};

log("EXPORT_READY", "bot.cjs FULL PREMIUM + LOGGING TOTALE PATCHATO pronto");
