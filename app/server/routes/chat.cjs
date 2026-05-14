/* =========================================================
   FILE: app/server/routes/chat.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE:
   Endpoint principale /chat — testo o video tutorial automatico
   con avatar parlante basato sul bot scelto.
========================================================= */

const path = require("path");

// BOT ENGINE (risposte normali)
const { handleConversation } = require(path.join(process.cwd(), "app/modules/bot/index.cjs"));

// INTENT ENGINE (riconosce guida + tutorial)
const { generateIntent } = require(path.join(process.cwd(), "app/modules/bot/intent-engine.cjs"));

// TUTORIAL ENGINE (avatar parlante + video)
const { createTutorialForGuide } = require(path.join(process.cwd(), "app/modules/tutorials.cjs"));

// CACHE VIDEO
const { getCachedTutorial, setCachedTutorial } = require(path.join(process.cwd(), "app/server/modules/video-cache.cjs"));

// GA4
const { trackGA4 } = require(path.join(process.cwd(), "app/server/services/ga4.cjs"));

/* =========================================================
   GUIDES (stub — poi le prendi dal DB o file)
========================================================= */
const GUIDES = {
  "come-scaricare-un-prodotto":
    "Per scaricare un prodotto, accedi alla tua area personale, vai su 'I miei acquisti' e clicca su 'Scarica'.",

  "come-funziona-la-newsletter":
    "La newsletter ti invia aggiornamenti periodici sui nuovi prodotti e offerte.",

  "come-vedere-i-miei-ordini":
    "Vai nella sezione 'Ordini' per vedere lo storico dei tuoi acquisti."
};

/* =========================================================
   FUNZIONE: chat (Java‑mode)
========================================================= */
async function chat(req) {
  console.log("[DEBUG chat] chat() chiamato");

  const uid = req.uid;
  const message = req.body?.message || "";
  const botAvatar = req.body?.bot || "generic"; // vendor, influencer, professor, newsletter, generic
  const gender = req.body?.gender || "male";    // opzionale

  try {
    if (typeof global.logBot === "function") {
      global.logBot("chat_request", { uid, message });
    }

    // Protezione catalogo
    if (!global.catalogReady) {
      return {
        success: true,
        reply: "Sto pensando… un attimo 😄",
        delay: true
      };
    }

    /* =====================================================
       1) INTENT ENGINE — capisce se è una guida
    ====================================================== */
    const intentData = await generateIntent(message, {
      botAvatar,
      gender
    });

    /* =====================================================
       2) SE NON È UNA GUIDA → risposta normale del bot
    ====================================================== */
    if (intentData.intent !== "guida" || !intentData.tutorial?.guideKey) {
      const finalReply = await handleConversation(req);

      trackGA4("chat_message", {
        uid,
        message,
        intent: intentData.intent || "unknown"
      });

      if (typeof global.logBot === "function") {
        global.logBot("chat_response", { uid });
      }

      return {
        success: true,
        ...finalReply,
        avatar: intentData.avatar || botAvatar
      };
    }

    /* =====================================================
       3) È UNA GUIDA → generiamo tutorial video automatico
    ====================================================== */
    const { guideKey } = intentData.tutorial;
    const guideText = GUIDES[guideKey];

    if (!guideText) {
      return {
        success: true,
        type: "text",
        reply: "Non ho ancora una guida video per questa domanda, ma posso spiegartelo a parole.",
        avatar: intentData.avatar || botAvatar
      };
    }

    /* =====================================================
       4) CACHE — se il video esiste già, non rigenerarlo
    ====================================================== */
    const cacheKey = `${guideKey}:${botAvatar}:${gender}`;
    let videoUrl = getCachedTutorial(cacheKey);

    if (!videoUrl) {
      videoUrl = await createTutorialForGuide(
        guideKey,
        guideText,
        botAvatar,
        gender
      );
      setCachedTutorial(cacheKey, videoUrl);
    }

    /* =====================================================
       5) RISPOSTA VIDEO PER LA LIM
    ====================================================== */
    trackGA4("chat_message", {
      uid,
      message,
      intent: "guida"
    });

    return {
      success: true,
      type: "video",
      url: videoUrl,
      avatar: intentData.avatar || botAvatar
    };

  } catch (err) {
    console.error("❌ Errore chat:", err);

    if (typeof global.logEvent === "function") {
      global.logEvent("chat_error", { uid, error: err?.message || "unknown" });
    }

    return {
      success: false,
      reply: "Si è verificato un errore. Riprova tra qualche secondo."
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function message(req) {
  console.log("[DEBUG chat] alias message() → chat()");
  return chat(req);
}

async function chatAlias(req) {
  console.log("[DEBUG chat] alias chatAlias() → chat()");
  return chat(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  chat,
  message,
  chatAlias
};
