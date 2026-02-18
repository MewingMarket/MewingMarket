/**
 * app/server/routes/chat.cjs
 * Endpoint principale /chat
 */

// BOT → percorso corretto
const { detectIntent, handleConversation, reply: buildReply } = require("../../modules/bot/index.cjs");

// GA4 → dal nuovo server
const { trackGA4 } = require("../services/ga4.cjs");

module.exports = function (app) {
  app.post("/chat", async (req, res) => {
    const uid = req.uid;
    const userState = req.userState;
    const message = req.body?.message || "";

    try {
      if (typeof global.logBot === "function") {
        global.logBot("chat_request", { uid, message });
      }

      // 1) Intent detection
      const intent = await detectIntent(message, uid);

      // 2) Conversation handler
      const response = await handleConversation(intent, message, uid, userState);

      // 3) Reply builder (NON invia nulla)
      const finalReply = await buildReply(response, uid);

      // GA4 tracking
      trackGA4("chat_message", {
        uid,
        intent,
        message
      });

      if (typeof global.logBot === "function") {
        global.logBot("chat_response", { uid, finalReply });
      }

      // ⭐ Risposta Express sicura
      return res.json(finalReply);

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
