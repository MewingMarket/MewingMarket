/* =========================================================
   FILE: app/server/routes/chat-voice.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Input vocale → trascrizione → bot → risposta
========================================================= */

const fs = require("fs");
const path = require("path");
const multer = require("multer");

// BOT
const {
  detectIntent,
  handleConversation,
  reply: buildReply
} = require(path.join(process.cwd(), "app/modules/bot/index.cjs"));

// GA4
const { trackGA4 } = require(path.join(process.cwd(), "app/server/services/ga4.cjs"));

// AUDIO
const { transcribeAudio } = require(path.join(process.cwd(), "app/modules/audio.cjs"));

// PATCH: percorso upload ASSOLUTO
const uploadDir = path.join(process.cwd(), "app/public/uploads");

// Multer storage (uguale all’originale)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, "voice_" + Date.now() + ".webm")
});

const upload = multer({ storage });

/* =========================================================
   FUNZIONE: chatVoice
   (ex POST /chat/voice)
========================================================= */
async function chatVoice(req, res) {
  // Applica upload.single("audio") in Java‑mode
  await new Promise((resolve, reject) => {
    upload.single("audio")(req, res, err => {
      if (err) reject(err);
      else resolve();
    });
  });

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

    // 4) Reply builder
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
    console.error("❌ Errore chatVoice:", err);

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
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  chatVoice
};
