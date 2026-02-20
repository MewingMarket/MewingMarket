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

      /* ⭐ PATCH READY SYSTEM:
         Se il catalogo non è ancora pronto, non chiamiamo il bot.
         Evitiamo undefined, fatal error e timeout GPT.
      */
      if (!global.catalogReady) {
        return res.json({
          reply: "Sto pensando… un attimo 😄",
          delay: true
        });
      }

      // ⭐ Passiamo req e res direttamente al bot
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
