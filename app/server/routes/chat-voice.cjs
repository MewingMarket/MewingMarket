/**
 * app/server/routes/chat-voice.cjs
 * Endpoint /chat/voice — input vocale → testo → bot
 * Versione 2026.200 — require assoluti + uploadDir assoluto
 */

const fs = require("fs");
const path = require("path");
const multer = require("multer");

// BOT → percorso assoluto
const {
  detectIntent,
  handleConversation,
  reply: buildReply
} = require(path.join(process.cwd(), "app/modules/bot/index.cjs"));

// GA4 → percorso assoluto
const { trackGA4 } = require(path.join(process.cwd(), "app/server/services/ga4.cjs"));

// AUDIO → percorso assoluto
const { transcribeAudio } = require(path.join(process.cwd(), "app/modules/audio.cjs"));

module.exports = function (app) {

  // PATCH: percorso upload ASSOLUTO
  const uploadDir = path.join(process.cwd(), "app/public/uploads");

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, "voice_" + Date.now() + ".webm")
  });

  const upload = multer({ storage });

  /* =========================================================
     ENDPOINT /chat/voice
  ========================================================== */
  app.post("/chat/voice", upload.single("audio"), async (req, res) => {
    const uid = req.uid;
    const userState = req.userState;

    try {
      if (!req.file) {
        return res.json({ error: "Nessun file audio ricevuto" });
      }

      const audioPath = req.file.path;

      if (typeof global.logBot === "function") {
        global.logBot("voice_received", { uid, file: audioPath });
      }

      // 1) Trascrizione audio → testo
      const text = await transcribeAudio(audioPath);

      if (typeof global.logBot === "function") {
        global.logBot("voice_transcribed", { uid, text });
      }

      // 2) Intent detection
      const intent = await detectIntent(text, uid);

      // 3) Conversation handler
      const response = await handleConversation(intent, text, uid, userState);

      // 4) Reply builder (NON invia nulla)
      const finalReply = await buildReply(response, uid);

      // GA4 tracking
      trackGA4("voice_message", {
        uid,
        intent,
        text
      });

      return res.json({
        text,
        ...finalReply
      });

    } catch (err) {
      console.error("❌ Errore /chat/voice:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("chat_voice_error", { uid, error: err?.message || "unknown" });
      }

      return res.json({
        error: "Errore durante l'elaborazione del messaggio vocale"
      });

    } finally {
      try {
        if (req.file?.path) fs.unlinkSync(req.file.path);
      } catch {}
    }
  });
};
