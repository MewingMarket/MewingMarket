/* =========================================================
   FILE: app/server/routes/chat.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Endpoint principale /chat — bot conversazionale
========================================================= */

const path = require("path");

// BOT
const { handleConversation } = require(path.join(process.cwd(), "app/modules/bot/index.cjs"));

// GA4
const { trackGA4 } = require(path.join(process.cwd(), "app/server/services/ga4.cjs"));

/* =========================================================
   FUNZIONE: chat (Java‑mode)
========================================================= */
async function chat(req) {
  console.log("[DEBUG chat] chat() chiamato");

  const uid = req.uid;
  const message = req.body?.message || "";

  try {
    if (typeof global.logBot === "function") {
      global.logBot("chat_request", { uid, message });
    }

    // PATCH: protezione catalogo
    if (!global.catalogReady) {
      return {
        success: true,
        reply: "Sto pensando… un attimo 😄",
        delay: true
      };
    }

    // Conversazione bot (Java‑mode)
    const finalReply = await handleConversation(req);

    // GA4 tracking
    trackGA4("chat_message", {
      uid,
      message,
      intent: req?.userState?.lastIntent || "unknown"
    });

    if (typeof global.logBot === "function") {
      global.logBot("chat_response", { uid });
    }

    return {
      success: true,
      ...finalReply
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
