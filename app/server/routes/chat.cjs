/**
 * app/server/routes/chat.cjs
 * Endpoint principale /chat — versione corretta e modulare
 */

const path = require("path");

// PATCH: require assoluto
const { handleConversation } = require(path.join(process.cwd(), "app/modules/bot/index.cjs"));
const { trackGA4 } = require(path.join(process.cwd(), "app/server/services/ga4.cjs"));

module.exports = function (app) {
  app.post("/chat", async (req, res) => {
    const uid = req.uid;
    const message = req.body?.message || "";

    try {
      if (typeof global.logBot === "function") {
        global.logBot("chat_request", { uid, message });
      }

      if (!global.catalogReady) {
        return res.json({
          reply: "Sto pensando… un attimo 😄",
          delay: true
        });
      }

      await handleConversation(req, res);

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
