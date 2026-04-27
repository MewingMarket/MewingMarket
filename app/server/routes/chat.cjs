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
   FUNZIONE: chat
   (ex POST /chat)
========================================================= */
async function chat(req, res) {
  const uid = req.uid;
  const message = req.body?.message || "";

  try {
    if (typeof global.logBot === "function") {
      global.logBot("chat_request", { uid, message });
    }

    // PATCH: protezione catalogo
    if (!global.catalogReady) {
      return res.json({
        reply: "Sto pensando… un attimo 😄",
        delay: true
      });
    }

    // Conversazione bot (gestisce già la risposta)
    await handleConversation(req, res);

    // GA4 tracking
    trackGA4("chat_message", {
      uid,
      message,
      intent: req?.userState?.lastIntent || "unknown"
    });

    if (typeof global.logBot === "function") {
      global.logBot("chat_response", { uid });
    }

    return;

  } catch (err) {
    console.error("❌ Errore chat:", err);

    if (typeof global.logEvent === "function") {
      global.logEvent("chat_error", { uid, error: err?.message || "unknown" });
    }

    return res.json({
      reply: "Si è verificato un errore. Riprova tra qualche secondo."
    });
  }
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  chat
};
