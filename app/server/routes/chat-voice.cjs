/* =========================================================
   FILE: app/server/routes/chat-voice.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Input vocale → trascrizione → bot → risposta
========================================================= */

const fs = require("fs");
const path = require("path");

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

/* =========================================================
   FUNZIONE: chatVoice (Java‑mode)
========================================================= */
async function chatVoice(req) {
  console.log("[DEBUG voice] chatVoice() chiamato");

  // Assicura cartella upload
  try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}

  // Nome file temporaneo
  const filename = "voice_" + Date.now() + ".webm";
  const filePath = path.join(uploadDir, filename);

  try {
    // STREAM MANUALE (Java‑mode)
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(filePath);
      req.pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
    });

    const uid = req.uid;
    const userState = req.userState;

    if (typeof global.logBot === "function") {
      global.logBot("voice_received", { uid, file: filePath });
    }

    // 1) Trascrizione
    const text = await transcribeAudio(filePath);

    if (typeof global.logBot === "function") {
      global.logBot("voice_transcribed", { uid, text });
    }

    // 2) Intent
    const intent = await detectIntent(text, uid);

    // 3) Conversazione
    const response = await handleConversation(intent, text, uid, userState);

    // 4) Reply builder
    const finalReply = await buildReply(response, uid);

    // GA4
    trackGA4("voice_message", { uid, intent, text });

    return {
      success: true,
      text,
      ...finalReply
    };

  } catch (err) {
    console.error("❌ Errore chatVoice:", err);

    if (typeof global.logEvent === "function") {
      global.logEvent("chat_voice_error", {
        uid: req.uid,
        error: err?.message || "unknown"
      });
    }

    return {
      success: false,
      error: "Errore durante l'elaborazione del messaggio vocale"
    };

  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function voice(req) {
  console.log("[DEBUG voice] alias voice() → chatVoice()");
  return chatVoice(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  chatVoice,
  voice
};
