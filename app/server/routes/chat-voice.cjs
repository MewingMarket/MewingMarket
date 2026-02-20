/**
 * app/server/routes/chat-voice.cjs
 * Endpoint /chat/voice — input vocale → testo → bot
 */

const fs = require("fs");
const path = require("path");
const multer = require("multer");

// BOT → percorso corretto
const { detectIntent, handleConversation, reply: buildReply } = require("../../modules/bot/index.cjs");

// GA4 → dal nuovo server
const { trackGA4 } = require("../services/ga4.cjs");

// AUDIO → percorso corretto
const { transcribeAudio } = require("../../modules/audio.cjs");

module.exports = function (app) {
  const ROOT = path.resolve(__dirname, "..", "..");
  const uploadDir = path.join(ROOT, "public", "uploads");

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
      // Pulizia file temporaneo
      try {
        if (req.file?.path) fs.unlinkSync(req.file.path);
      } catch {}
    }
  });
};
