/**
 * app/server/routes/chat.cjs
 * Endpoint principale /chat — versione corretta e modulare
 */

const { handleConversation } = require("../../modules/bot/index.cjs");
const { trackGA4 } = require("../services/ga4.cjs");

module.exports = function (app) {
  app.post("/chat", async (req, res) => {
    const uid = req.uid;
    const message = req.body?.message || "";

    try {
      if (typeof global.logBot === "function") {
        global.logBot("chat_request", { uid, message });
      }

      // ⭐ Passiamo req e res direttamente al bot
      const finalReply = await handleConversation(req, res);

      // GA4 tracking
      trackGA4("chat_message", {
        uid,
        message,
        intent: req?.userState?.lastIntent || "unknown"
      });

      if (typeof global.logBot === "function") {
        global.logBot("chat_response", { uid, finalReply });
      }

      // ⭐ handleConversation ha già risposto con res.json()
      return;

    } catch (err) {
      console.error("❌ Errore /chat:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("chat_error", { uid, error: err?.message || "unknown" });
      }

      return res.json({
        reply: "Si è verificato un errore. Riprova tra qualche secondo."
      });
    }
  });
};
