/**
 * modules/bot.cjs — VERSIONE FULL PREMIUM + LOGGING TOTALE
 * Include:
 * - Tutto il codice originale
 * - Cards, Quick, Rich, Post, Cross
 * - WhatsApp-style premium
 * - Logging completo per ogni funzione
 * - GPT fallback migliorato
 */

const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const fetch = require("node-fetch");

/* ============================================================
   LOG ENGINE — logging totale per tutte le funzioni del bot
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
   IMPORT MODULI INTERNI ORIGINALI
   ============================================================ */
const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  productReply,
  productLongReply,
  fuzzyMatchProduct // verrà patchato più avanti
} = require(path.join(__dirname, "catalogo.cjs"));

const { normalize, cleanSearchQuery } = require(path.join(__dirname, "utils.cjs"));
const { getProducts } = require(path.join(__dirname, "airtable.cjs"));
const Context = require(path.join(__dirname, "context.cjs"));
const Memory = require(path.join(__dirname, "memory.cjs"));

/* ============================================================
   IMPORT PREMIUM MODULES
   ============================================================ */
const Premium = require(path.join(__dirname, "premium", "index.cjs"));
log("INIT", "Premium modules loaded");

/* ============================================================
   TRACKING BOT (ORIGINALE + LOG)
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
   EMOJI BOOSTER (ORIGINALE + LOG)
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
   SYSTEM PROMPT GPT — VERSIONE PREMIUM
   ============================================================ */
const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket, integrato nel sito.

Tono:
- chiaro
- diretto
- professionale
- amichevole
- commerciale quando serve

Regole:
- Non inventare prodotti, prezzi o link.
- Usa solo i prodotti presenti nel catalogo.
- Se l'utente chiede consigli: proponi il prodotto più adatto.
- Se l'utente ha dubbi: chiarisci e rassicura.
- Se l'utente è pronto: porta alla chiusura con link Payhip.
- Risposte brevi ma dense.
- Se qualcosa va storto, rispondi comunque in modo utile.
- Non dire mai "non so", trova sempre un modo per aiutare.

Stile Premium:
- Usa markup WhatsApp-style (mm-card, mm-info, mm-rich, mm-quick).
- Mantieni un tono umano, caldo, professionale.
- Guida l’utente come un consulente digitale.
`;

/* ============================================================
   CORE GPT (OPENROUTER) — VERSIONE PREMIUM + LOGGING
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

    const payload = {
      model: "meta-llama/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: system },
        { role: "assistant", content: "Memoria: " + JSON.stringify(memory || []) },
        { role: "assistant", content: "Contesto pagina: " + JSON.stringify(context || {}) },
        { role: "assistant", content: "Dati: " + JSON.stringify(extraData || {}) },
        { role: "user", content: userPrompt || "" }
      ]
    };

    log("GPT_PAYLOAD", payload);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    log("GPT_RESPONSE_RAW", json);

    const out = json?.choices?.[0]?.message?.content;

    if (out && typeof out === "string") {
      log("GPT_RESPONSE", out);
      return addEmojis(out.trim());
    }

    /* -------------------------
       FALLBACK 1 — MODELLO 2
       ------------------------- */
    log("GPT_FALLBACK_1", "Primary model returned no output");

    const fallbackPayload = {
      model: "google/gemini-flash-1.5",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt || "" }
      ]
    };

    const res2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(fallbackPayload)
    });

    const json2 = await res2.json();
    log("GPT_FALLBACK_1_RAW", json2);

    const out2 = json2?.choices?.[0]?.message?.content;

    if (out2 && typeof out2 === "string") {
      log("GPT_FALLBACK_1_SUCCESS", out2);
      return addEmojis(out2.trim());
    }

    /* -------------------------
       FALLBACK 2 — RISPOSTA BASE
       ------------------------- */
    log("GPT_FALLBACK_2", "Both models failed");

    return addEmojis(
      "Sto avendo un problema tecnico, ma non ti lascio fermo: dimmi cosa vuoi ottenere e ti do subito una mano."
    );

  } catch (err) {
    log("GPT_ERROR", err);

    /* -------------------------
       FALLBACK 3 — ERRORE TOTALE
       ------------------------- */
    return addEmojis(
      "C’è un problema temporaneo, ma posso comunque aiutarti: dimmi cosa vuoi fare e ti guido."
    );
  }
} /* ============================================================
   TRASCRIZIONE VOCALE — WHISPER + LOGGING
   ============================================================ */
async function transcribeAudio(filePath) {
  log("AUDIO_TRANSCRIBE_START", filePath);

  try {
    if (!filePath || !fs.existsSync(filePath)) {
      log("AUDIO_TRANSCRIBE_ERROR", "File non trovato");
      return "Non riesco a leggere il file audio, puoi riprovare?";
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("model", "openai/whisper-1");

    const res = await axios.post(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
      }
    );

    log("AUDIO_TRANSCRIBE_RESPONSE", res.data);

    return res.data?.text || "Non riesco a capire il vocale 😅";

  } catch (err) {
    log("AUDIO_TRANSCRIBE_FATAL", err);
    return "Il vocale non è chiaro, puoi ripetere?";
  }
}

/* ============================================================
   UTILS DI STATO — LOGGING
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

    if (req.userState && typeof req.userState === "object") {
      req.userState.state = newState;
    }
  } catch (err) {
    log("STATE_ERROR", err);
  }
}

/* ============================================================
   REPLY — LOGGING TOTALE
   ============================================================ */
function reply(res, text) {
  try {
    log("BOT_REPLY", text);
    trackBot("bot_reply", { text });
    res.json({ reply: addEmojis(text || "") });
  } catch (err) {
    log("BOT_REPLY_ERROR", err);
    res.json({ reply: "Sto avendo un problema tecnico, ma posso aiutarti comunque." });
  }
}

/* ============================================================
   YES DETECTOR — LOGGING
   ============================================================ */
function isYes(text) {
  const t = (text || "").toLowerCase();
  const out =
    t.includes("si") ||
    t.includes("sì") ||
    t.includes("ok") ||
    t.includes("va bene") ||
    t.includes("certo") ||
    t.includes("yes");

  log("YES_DETECT", { text, result: out });
  return out;
}

/* ============================================================
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
      q.includes("come va") ||
      q.includes("come stai") ||
      q.includes("tutto bene") ||
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
      log("INTENT_MATCH", { intent: "conversazione" });
      return { intent: "conversazione", sub: null };
    }

    // Menu
    if (
      q.includes("menu") ||
      q.includes("inizio") ||
      q.includes("start") ||
      q.includes("opzioni") ||
      q.includes("help") ||
      q.includes("aiuto")
    ) {
      log("INTENT_MATCH", { intent: "menu" });
      return { intent: "menu", sub: null };
    }

    // Catalogo
    if (
      q.includes("catalogo") ||
      q.includes("prodotti") ||
      q.includes("store") ||
      q.includes("shop")
    ) {
      log("INTENT_MATCH", { intent: "catalogo" });
      return { intent: "catalogo", sub: null };
    }

    // Newsletter
    if (
      q.includes("iscrizione") ||
      q.includes("mi iscrivo") ||
      q.includes("voglio iscrivermi") ||
      q.includes("registrazione")
    ) {
      log("INTENT_MATCH", { intent: "newsletter", sub: "subscribe" });
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
        log("INTENT_MATCH", { intent: "newsletter", sub: "unsubscribe" });
        return { intent: "newsletter", sub: "unsubscribe" };
      }
      log("INTENT_MATCH", { intent: "newsletter", sub: "subscribe" });
      return { intent: "newsletter", sub: "subscribe" };
    }  // Social specifici
    if (q.includes("instagram")) {
      log("INTENT_MATCH", { intent: "social_specifico", sub: "instagram" });
      return { intent: "social_specifico", sub: "instagram" };
    }
    if (q.includes("tiktok")) {
      log("INTENT_MATCH", { intent: "social_specifico", sub: "tiktok" });
      return { intent: "social_specifico", sub: "tiktok" };
    }
    if (q.includes("youtube")) {
      log("INTENT_MATCH", { intent: "social_specifico", sub: "youtube" });
      return { intent: "social_specifico", sub: "youtube" };
    }
    if (q.includes("facebook")) {
      log("INTENT_MATCH", { intent: "social_specifico", sub: "facebook" });
      return { intent: "social_specifico", sub: "facebook" };
    }
    if (q.includes("threads")) {
      log("INTENT_MATCH", { intent: "social_specifico", sub: "threads" });
      return { intent: "social_specifico", sub: "threads" };
    }
    if (q.includes("linkedin")) {
      log("INTENT_MATCH", { intent: "social_specifico", sub: "linkedin" });
      return { intent: "social_specifico", sub: "linkedin" };
    }
    if (q === "x" || q.includes("x ")) {
      log("INTENT_MATCH", { intent: "social_specifico", sub: "x" });
      return { intent: "social_specifico", sub: "x" };
    }

    // Social generico
    if (q.includes("social")) {
      log("INTENT_MATCH", { intent: "social" });
      return { intent: "social", sub: null };
    }

    // Privacy
    if (q.includes("privacy") || q.includes("dati") || q.includes("gdpr")) {
      log("INTENT_MATCH", { intent: "privacy" });
      return { intent: "privacy", sub: null };
    }

    // Termini
    if (q.includes("termini") || q.includes("condizioni") || q.includes("terms")) {
      log("INTENT_MATCH", { intent: "termini" });
      return { intent: "termini", sub: null };
    }

    // Cookie
    if (q.includes("cookie")) {
      log("INTENT_MATCH", { intent: "cookie" });
      return { intent: "cookie", sub: null };
    }

    // Resi
    if (q.includes("resi") || q.includes("rimborsi") || q.includes("rimborso")) {
      log("INTENT_MATCH", { intent: "resi" });
      return { intent: "resi", sub: null };
    }

    // FAQ
    if (q.includes("faq")) {
      log("INTENT_MATCH", { intent: "faq" });
      return { intent: "faq", sub: null };
    }

    // Contatti
    if (
      q.includes("contatti") ||
      q.includes("contatto") ||
      q.includes("email") ||
      q.includes("whatsapp") ||
      q.includes("numero") ||
      q.includes("telefono")
    ) {
      log("INTENT_MATCH", { intent: "contatti" });
      return { intent: "contatti", sub: null };
    }

    // Dove siamo
    if (
      q.includes("dove siamo") ||
      q.includes("indirizzo") ||
      q.includes("sede")
    ) {
      log("INTENT_MATCH", { intent: "dovesiamo" });
      return { intent: "dovesiamo", sub: null };
    }

    // Supporto
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
      if (q.includes("scaricare") || q.includes("download")) {
        log("INTENT_MATCH", { intent: "supporto", sub: "download" });
        return { intent: "supporto", sub: "download" };
      }
      if (q.includes("payhip")) {
        log("INTENT_MATCH", { intent: "supporto", sub: "payhip" });
        return { intent: "supporto", sub: "payhip" };
      }
      if (q.includes("rimborso") || q.includes("resi")) {
        log("INTENT_MATCH", { intent: "supporto", sub: "rimborso" });
        return { intent: "supporto", sub: "rimborso" };
      }
      if (q.includes("email") || q.includes("contatto") || q.includes("contattare")) {
        log("INTENT_MATCH", { intent: "supporto", sub: "contatto" });
        return { intent: "supporto", sub: "contatto" };
      }
      log("INTENT_MATCH", { intent: "supporto", sub: null });
      return { intent: "supporto", sub: null };
    }

    // Acquisto diretto
    if (
      q.includes("acquisto") ||
      q.includes("fare un acquisto") ||
      q.includes("voglio acquistare") ||
      q.includes("procedo all acquisto") ||
      q.includes("procedo all'acquisto")
    ) {
      log("INTENT_MATCH", { intent: "acquisto_diretto" });
      return { intent: "acquisto_diretto", sub: null };
    }

    if (
      q.includes("acquista") ||
      q.includes("compra") ||
      q.includes("prendo") ||
      q.includes("lo prendo") ||
      q.includes("lo compro")
    ) {
      log("INTENT_MATCH", { intent: "acquisto_diretto" });
      return { intent: "acquisto_diretto", sub: null };
    }

    // Dettagli prodotto
    if (
      q.includes("dettagli") ||
      q.includes("approfondisci") ||
      q.includes("info") ||
      q.includes("informazioni") ||
      q.includes("spiegami meglio")
    ) {
      log("INTENT_MATCH", { intent: "dettagli_prodotto" });
      return { intent: "dettagli_prodotto", sub: null };
    }

    // Video prodotto
    if (
      q.includes("video") ||
      q.includes("anteprima") ||
      q.includes("presentazione")
    ) {
      log("INTENT_MATCH", { intent: "video_prodotto" });
      return { intent: "video_prodotto", sub: null };
    } // Prezzo prodotto
    if (
      q.includes("prezzo") ||
      q.includes("quanto costa") ||
      q.includes("costa") ||
      q.includes("costo")
    ) {
      log("INTENT_MATCH", { intent: "prezzo_prodotto" });
      return { intent: "prezzo_prodotto", sub: null };
    }

    // Trattativa
    if (
      q.includes("sconto") ||
      q.includes("sconti") ||
      q.includes("offerta") ||
      q.includes("promo")
    ) {
      log("INTENT_MATCH", { intent: "trattativa", sub: "sconto" });
      return { intent: "trattativa", sub: "sconto" };
    }

    // Obiezioni
    if (
      q.includes("è caro") ||
      q.includes("troppo caro") ||
      q.includes("non so se vale") ||
      q.includes("non so se mi serve") ||
      q.includes("caro")
    ) {
      log("INTENT_MATCH", { intent: "obiezione", sub: "prezzo" });
      return { intent: "obiezione", sub: "prezzo" };
    }

    // Match prodotto fuzzy
    const product = fuzzyMatchProduct(text);
    if (product) {
      log("INTENT_MATCH", { intent: "prodotto", sub: product.slug });
      return { intent: "prodotto", sub: product.slug };
    }

    // Allegati
    if (rawText && rawText.startsWith("FILE:")) {
      const filename = rawText.replace("FILE:", "").trim();
      log("INTENT_MATCH", { intent: "allegato", sub: filename });
      return { intent: "allegato", sub: filename };
    }

    // Fallback GPT
    log("INTENT_FALLBACK", { intent: "gpt" });
    return { intent: "gpt", sub: null };

  } catch (err) {
    log("INTENT_FATAL_ERROR", err);
    return { intent: "gpt", sub: null };
  }
}

/* ============================================================
   HANDLE CONVERSATION — BLOCCO 1 (inizio)
   Logging totale + Premium
   ============================================================ */
async function handleConversation(req, res, intent, sub, rawText) {
  log("HANDLE_START", { intent, sub, rawText });

  try {
    const uid = req?.uid || "unknown_user";
    const state = req?.userState || {};

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
      log("MEMORY_PUSH", { uid, rawText });
    } catch (err) {
      log("MEMORY_ERROR", err);
    }

    // Contesto pagina
    const pageContext = (() => {
      try {
        const ctx = Context.get(uid) || {};
        log("CONTEXT_LOADED", ctx);
        return ctx;
      } catch (err) {
        log("CONTEXT_ERROR", err);
        return {};
      }
    })();

    trackBot("conversation_step", { uid, intent, sub, text: rawText });
    log("TRACK_SENT", true);

    /* ------------------------------------------
       GPT FALLBACK / GENERALE
       ------------------------------------------ */
    if (intent === "gpt") {
      log("HANDLE_BRANCH", "GPT fallback branch");
      const risposta = await callGPT(
        rawText || "",
        Memory.get(uid),
        pageContext
      );
      log("HANDLE_GPT_REPLY", risposta);
      return reply(res, risposta || "Dimmi pure come posso aiutarti.");
    }

    /* ------------------------------------------
       CONVERSAZIONE GENERALE
       ------------------------------------------ */
    if (intent === "conversazione") {
      log("HANDLE_BRANCH", "conversazione");
      const risposta = await callGPT(
        rawText || "",
        Memory.get(uid),
        pageContext,
        "\nRispondi in modo amichevole, breve, coerente con il brand MewingMarket, e collega la conversazione ai prodotti o al valore del digitale quando ha senso."
      );
      log("HANDLE_CONVERSAZIONE_REPLY", risposta);
      return reply(res, risposta || "Dimmi pure come posso aiutarti 😊");
    }

    /* ------------------------------------------
       MENU
       ------------------------------------------ */
    if (intent === "menu") {
      log("HANDLE_BRANCH", "menu");
      setState(req, "menu");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Ciao 👋 Sono il Copilot di MewingMarket</div>
  <div class="mm-card-body">
    Posso aiutarti a:
    • scegliere il prodotto giusto<br>
    • capire cosa fa ogni guida<br>
    • risolvere problemi di download o pagamenti<br>
    • gestire newsletter, contatti, social<br>
    • chiarire dubbi su resi, privacy, termini<br><br>
    Scrivi una parola chiave come:<br>
    <b>catalogo</b>, <b>ecosistema</b>, <b>business</b>, <b>contenuti</b>, <b>produttività</b>, <b>supporto</b>, <b>newsletter</b>.
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Mostra menu iniziale",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più umano e accogliente, senza cambiare la struttura."
      );

      const final = enriched || base;
      log("HANDLE_MENU_REPLY", final);
      return reply(res, final);
    }  /* ------------------------------------------
       CATALOGO
       ------------------------------------------ */
    if (intent === "catalogo") {
      log("HANDLE_BRANCH", "catalogo");
      setState(req, "catalogo");

      if (!PRODUCTS.length) {
        const msg = "Il catalogo sarà presto disponibile. Stiamo preparando i primi prodotti.";
        log("HANDLE_CATALOG_EMPTY", msg);
        return reply(res, msg);
      }

      let out = `
<div class="mm-card">
  <div class="mm-card-title">📚 Catalogo MewingMarket</div>
  <div class="mm-card-body">
`;

      for (const p of PRODUCTS) {
        try {
          out += `
    • <b>${p.titoloBreve || p.titolo}</b> — ${p.prezzo}€<br>
    <a href="${p.linkPayhip}">${p.linkPayhip}</a><br><br>
`;
        } catch (err) {
          log("HANDLE_CATALOG_ERROR", err);
        }
      }

      out += `
  </div>
</div>

<div class="mm-info">
Puoi scrivere il nome di un prodotto o il tuo obiettivo, e ti consiglio cosa scegliere.
</div>
`;

      const enriched = await callGPT(
        rawText || "Mostra catalogo",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase finale che inviti a chiedere consiglio.",
        { products: PRODUCTS }
      );

      const final = out + (enriched || "");
      log("HANDLE_CATALOG_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       NEWSLETTER
       ------------------------------------------ */
    if (intent === "newsletter") {
      log("HANDLE_BRANCH", "newsletter");
      setState(req, "newsletter");

      /* --- DISISCRIZIONE --- */
      if (sub === "unsubscribe") {
        const base = `
<div class="mm-card">
  <div class="mm-card-title">Annulla iscrizione</div>
  <div class="mm-card-body">
    Vuoi annullare l'iscrizione alla newsletter?<br><br>
    <a href="disiscriviti.html">disiscriviti.html</a><br><br>
    Se hai problemi:<br>
    supporto@mewingmarket.it
  </div>
</div>
`;

        const enriched = await callGPT(
          rawText || "Disiscrizione newsletter",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più empatico ma chiaro."
        );

        const final = enriched || base;
        log("HANDLE_NEWSLETTER_UNSUB", final);
        return reply(res, final);
      }

      /* --- ISCRIZIONE --- */
      const base = `
<div class="mm-card">
  <div class="mm-card-title">Iscriviti alla newsletter</div>
  <div class="mm-card-body">
    Riceverai:<br>
    • contenuti utili<br>
    • aggiornamenti sui prodotti<br>
    • novità e risorse pratiche<br><br>
    <a href="iscrizione.html">iscrizione.html</a>
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Iscrizione newsletter",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più motivante, senza esagerare."
      );

      const final = enriched || base;
      log("HANDLE_NEWSLETTER_SUB", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       SOCIAL SPECIFICO
       ------------------------------------------ */
    if (intent === "social_specifico") {
      log("HANDLE_BRANCH", "social_specifico");

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
      log("SOCIAL_LOOKUP", { sub, link });

      if (!link) {
        const msg = "Non trovo questo social, vuoi vedere la lista completa?";
        log("SOCIAL_NOT_FOUND", msg);
        return reply(res, msg);
      }

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Profilo ${sub.charAt(0).toUpperCase() + sub.slice(1)}</div>
  <div class="mm-card-body">
    <a href="${link}">${link}</a><br><br>
    Vuoi vedere anche gli altri social o tornare al menu?
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Mostra social " + sub,
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che spieghi cosa trova l’utente su questo social."
      );

      const final = enriched || base;
      log("HANDLE_SOCIAL_SPECIFIC_REPLY", final);
      return reply(res, final);
    }  /* ------------------------------------------
       SOCIAL GENERICO
       ------------------------------------------ */
    if (intent === "social") {
      log("HANDLE_BRANCH", "social");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">I nostri social 📲</div>
  <div class="mm-card-body">
    Instagram: <a href="https://www.instagram.com/mewingmarket">Instagram</a><br>
    TikTok: <a href="https://www.tiktok.com/@mewingmarket">TikTok</a><br>
    YouTube: <a href="https://www.youtube.com/@mewingmarket2">YouTube</a><br>
    Facebook: <a href="https://www.facebook.com/profile.php?id=61584779793628">Facebook</a><br>
    X: <a href="https://x.com/mewingm8">X</a><br>
    Threads: <a href="https://www.threads.net/@mewingmarket">Threads</a><br>
    LinkedIn: <a href="https://www.linkedin.com/company/mewingmarket">LinkedIn</a><br><br>
    Vuoi tornare al menu o vedere il catalogo?
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Mostra social generici",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a seguire almeno un social."
      );

      const final = enriched || base;
      log("HANDLE_SOCIAL_GENERIC_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       PRIVACY
       ------------------------------------------ */
    if (intent === "privacy") {
      log("HANDLE_BRANCH", "privacy");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Privacy Policy</div>
  <div class="mm-card-body">
    In sintesi:<br>
    • raccogliamo nome e email per la newsletter<br>
    • i dati di pagamento sono gestiti da Payhip<br>
    • usiamo cookie tecnici e analytics<br>
    • puoi chiedere accesso, modifica o cancellazione dei tuoi dati<br><br>
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

      const final = enriched || base;
      log("HANDLE_PRIVACY_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       TERMINI E CONDIZIONI
       ------------------------------------------ */
    if (intent === "termini") {
      log("HANDLE_BRANCH", "termini");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Termini e Condizioni</div>
  <div class="mm-card-body">
    In sintesi:<br>
    • vendiamo prodotti digitali tramite Payhip<br>
    • l'uso è personale<br>
    • il download è immediato<br>
    • i rimborsi sono valutati caso per caso<br><br>
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

      const final = enriched || base;
      log("HANDLE_TERMINI_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       COOKIE
       ------------------------------------------ */
    if (intent === "cookie") {
      log("HANDLE_BRANCH", "cookie");

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

      const final = enriched || base;
      log("HANDLE_COOKIE_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       RESI E RIMBORSI
       ------------------------------------------ */
    if (intent === "resi") {
      log("HANDLE_BRANCH", "resi");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Resi e rimborsi</div>
  <div class="mm-card-body">
    I prodotti digitali non prevedono reso automatico,<br>
    ma valutiamo ogni richiesta caso per caso.<br><br>
    Pagina completa:<br>
    <a href="resi.html">resi.html</a><br><br>
    Se hai un problema specifico:<br>
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

      const final = enriched || base;
      log("HANDLE_RESI_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       FAQ
       ------------------------------------------ */
    if (intent === "faq") {
      log("HANDLE_BRANCH", "faq");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">FAQ</div>
  <div class="mm-card-body">
    Puoi consultare le FAQ qui:<br>
    <a href="FAQ.html">FAQ.html</a><br><br>
    Se non trovi la risposta:<br>
    supporto@mewingmarket.it
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "FAQ",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a chiedere se non trova la risposta."
      );

      const final = enriched || base;
      log("HANDLE_FAQ_REPLY", final);
      return reply(res, final);
    }  /* ------------------------------------------
       CONTATTI
       ------------------------------------------ */
    if (intent === "contatti") {
      log("HANDLE_BRANCH", "contatti");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Contatti ufficiali MewingMarket</div>
  <div class="mm-card-body">
    Vendite: vendite@mewingmarket.it<br>
    Supporto: supporto@mewingmarket.it<br>
    Email alternative: MewingMarket@outlook.it, mewingmarket2@gmail.com<br>
    WhatsApp Business: 352 026 6660<br><br>
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

      const final = enriched || base;
      log("HANDLE_CONTATTI_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       DOVE SIAMO
       ------------------------------------------ */
    if (intent === "dovesiamo") {
      log("HANDLE_BRANCH", "dovesiamo");

      const base = `
<div class="mm-card">
  <div class="mm-card-title">Dove siamo</div>
  <div class="mm-card-body">
    Strada Ciousse 35<br>
    18038 Sanremo (IM) — Italia<br><br>
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

      const final = enriched || base;
      log("HANDLE_DOVESIAMO_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       SUPPORTO
       ------------------------------------------ */
    if (intent === "supporto") {
      log("HANDLE_BRANCH", "supporto");
      setState(req, "supporto");

      /* --- SUPPORTO DOWNLOAD --- */
      if (sub === "download") {
        log("HANDLE_SUPPORTO_SUB", "download");

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

        const final = enriched || base;
        log("HANDLE_SUPPORTO_DOWNLOAD_REPLY", final);
        return reply(res, final);
      }

      /* --- SUPPORTO PAYHIP --- */
      if (sub === "payhip") {
        log("HANDLE_SUPPORTO_SUB", "payhip");

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

        const final = enriched || base;
        log("HANDLE_SUPPORTO_PAYHIP_REPLY", final);
        return reply(res, final);
      }

      /* --- SUPPORTO RIMBORSO --- */
      if (sub === "rimborso") {
        log("HANDLE_SUPPORTO_SUB", "rimborso");

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

        const final = enriched || base;
        log("HANDLE_SUPPORTO_RIMBORSO_REPLY", final);
        return reply(res, final);
      }

      /* --- SUPPORTO CONTATTO --- */
      if (sub === "contatto") {
        log("HANDLE_SUPPORTO_SUB", "contatto");

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

        const final = enriched || base;
        log("HANDLE_SUPPORTO_CONTATTO_REPLY", final);
        return reply(res, final);
      }

      /* --- SUPPORTO GENERICO --- */
      log("HANDLE_SUPPORTO_SUB", "generico");

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

      const final = enriched || base;
      log("HANDLE_SUPPORTO_GENERIC_REPLY", final);
      return reply(res, final);
  } /* ------------------------------------------
       PRODOTTO
       ------------------------------------------ */
    const lastProductSlug = state?.lastProductSlug || null;

    if (intent === "prodotto") {
      log("HANDLE_BRANCH", "prodotto");

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

      log("PRODUCT_MATCH_RESULT", product);

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

        const final = enriched || base;
        log("HANDLE_PRODOTTO_NOT_FOUND_REPLY", final);
        return reply(res, final);
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

      const final = enriched || base;
      log("HANDLE_PRODOTTO_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       ACQUISTO DIRETTO
       ------------------------------------------ */
    if (intent === "acquisto_diretto") {
      log("HANDLE_BRANCH", "acquisto_diretto");

      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (err) {
        log("ACQUISTO_MATCH_ERROR", err);
      }

      log("ACQUISTO_MATCH_RESULT", product);

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

        const final = enriched || base;
        log("HANDLE_ACQUISTO_NOT_FOUND_REPLY", final);
        return reply(res, final);
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

      const final = enriched || base;
      log("HANDLE_ACQUISTO_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       DETTAGLI PRODOTTO
       ------------------------------------------ */
    if (intent === "dettagli_prodotto") {
      log("HANDLE_BRANCH", "dettagli_prodotto");

      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (err) {
        log("DETTAGLI_MATCH_ERROR", err);
      }

      log("DETTAGLI_MATCH_RESULT", product);

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

        const final = enriched || base;
        log("HANDLE_DETTAGLI_NOT_FOUND_REPLY", final);
        return reply(res, final);
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

      const final = enriched || base;
      log("HANDLE_DETTAGLI_REPLY", final);
      return reply(res, final);
    }  /* ------------------------------------------
       VIDEO PRODOTTO
       ------------------------------------------ */
    if (intent === "video_prodotto") {
      log("HANDLE_BRANCH", "video_prodotto");

      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (err) {
        log("VIDEO_MATCH_ERROR", err);
      }

      log("VIDEO_MATCH_RESULT", product);

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

        const final = enriched || base;
        log("HANDLE_VIDEO_NOT_FOUND_REPLY", final);
        return reply(res, final);
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

        const final = enriched || base;
        log("HANDLE_VIDEO_NO_URL_REPLY", final);
        return reply(res, final);
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

      const final = enriched || base;
      log("HANDLE_VIDEO_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       PREZZO PRODOTTO
       ------------------------------------------ */
    if (intent === "prezzo_prodotto") {
      log("HANDLE_BRANCH", "prezzo_prodotto");

      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (err) {
        log("PREZZO_MATCH_ERROR", err);
      }

      log("PREZZO_MATCH_RESULT", product);

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

        const final = enriched || base;
        log("HANDLE_PREZZO_NOT_FOUND_REPLY", final);
        return reply(res, final);
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

      const final = enriched || base;
      log("HANDLE_PREZZO_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       TRATTATIVA / SCONTO
       ------------------------------------------ */
    if (intent === "trattativa") {
      log("HANDLE_BRANCH", "trattativa");

      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (err) {
        log("TRATTATIVA_MATCH_ERROR", err);
      }

      log("TRATTATIVA_MATCH_RESULT", product);

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

        const final = enriched || base;
        log("HANDLE_TRATTATIVA_NOT_FOUND_REPLY", final);
        return reply(res, final);
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

      const final = enriched || base;
      log("HANDLE_TRATTATIVA_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       OBIEZIONI SUL PREZZO
       ------------------------------------------ */
    if (intent === "obiezione") {
      log("HANDLE_BRANCH", "obiezione");

      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (err) {
        log("OBIEZIONE_MATCH_ERROR", err);
      }

      log("OBIEZIONE_MATCH_RESULT", product);

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

        const final = enriched || base;
        log("HANDLE_OBIEZIONE_NOT_FOUND_REPLY", final);
        return reply(res, final);
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

      const final = enriched || base;
      log("HANDLE_OBIEZIONE_REPLY", final);
      return reply(res, final);
          } /* ------------------------------------------
       ALLEGATI
       ------------------------------------------ */
    if (intent === "allegato") {
      log("HANDLE_BRANCH", "allegato");

      const filename = sub || "file";

      const base = `
<div class="mm-card">
  <div class="mm-card-title">📎 File ricevuto</div>
  <div class="mm-card-body">
    Ho ricevuto il tuo file: <b>${filename}</b><br><br>
    Vuoi:<br>
    • che lo analizzi<br>
    • che estragga informazioni<br>
    • che ti dica cosa contiene<br>
    • che lo riassuma
  </div>
</div>
`;

      const enriched = await callGPT(
        rawText || "Allegato ricevuto",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a spiegare cosa vuole fare con il file."
      );

      const final = enriched || base;
      log("HANDLE_ALLEGATO_REPLY", final);
      return reply(res, final);
    }

    /* ------------------------------------------
       FALLBACK FINALE
       ------------------------------------------ */
    log("HANDLE_BRANCH", "fallback_finale");

    const fallback = await callGPT(
      rawText || "Fallback",
      Memory.get(uid),
      pageContext,
      "\nRispondi come un assistente commerciale del sito, chiaro e utile."
    );

    log("HANDLE_FALLBACK_FINAL_REPLY", fallback);
    return reply(res, fallback || "Dimmi pure come posso aiutarti.");

  } catch (err) {
    log("HANDLE_FATAL_ERROR", err);
    return reply(res, "Sto avendo un problema tecnico, ma posso comunque aiutarti.");
  }
}

/* ============================================================
   MATCH PRODOTTO FUZZY — LOGGING TOTALE
   (inizio)
   ============================================================ */
function fuzzyMatchProduct(text) {
  log("FUZZY_START", text);

  try {
    if (!text) {
      log("FUZZY_EMPTY_TEXT", true);
      return null;
    }

    const PRODUCTS = getProducts() || [];
    const q = normalize(text);

    log("FUZZY_NORMALIZED", q);
    log("FUZZY_PRODUCTS_COUNT", PRODUCTS.length);

    let best = null;
    let bestScore = 0;

    for (const p of PRODUCTS) {
      const titolo = normalize(p.titolo || "");
      const breve = normalize(p.titoloBreve || "");
      const slug = normalize(p.slug || "");

      let score = 0;

      if (q.includes(slug)) score += 3;
      if (q.includes(titolo)) score += 3;
      if (q.includes(breve)) score += 2;

      if (titolo.includes(q)) score += 2;
      if (breve.includes(q)) score += 1;

      log("FUZZY_PRODUCT_SCORE", {
        product: p.slug,
        score,
        titolo,
        breve,
        slug
      });

      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    } if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    log("FUZZY_BEST_MATCH", {
      best: best ? best.slug : null,
      bestScore
    });

    return bestScore > 0 ? best : null;

  } catch (err) {
    log("FUZZY_FATAL_ERROR", err);
    return null;
  }
}

/* ============================================================
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

log("EXPORT_READY", "bot.cjs FULL PREMIUM + LOGGING TOTALE pronto");
