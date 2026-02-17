/**
 * modules/bot/whisper.cjs
 * WHISPER — trascrizione audio blindata e robusta
 */

const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

// PATCH: usa il logger globale del bot, fallback console
const log = global.logBot || console.log;

/* ============================================================
   TRANSCRIBE AUDIO — versione blindata
============================================================ */
async function transcribeAudio(filePath) {
  log("AUDIO_TRANSCRIBE_START", filePath);

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      log("AUDIO_NO_KEY", "OPENROUTER_API_KEY mancante");
      return "Non riesco a trascrivere il vocale al momento.";
    }

    if (!filePath) {
      log("AUDIO_NO_PATH", "filePath mancante");
      return "Non riesco a leggere il file audio.";
    }

    if (!fs.existsSync(filePath)) {
      log("AUDIO_FILE_NOT_FOUND", filePath);
      return "Non riesco a trovare il file audio.";
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("model", "openai/whisper-1");

    const res = await axios.post(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    log("AUDIO_TRANSCRIBE_RESPONSE", res.data);

    return res.data?.text || "Non riesco a capire il vocale.";
  } catch (err) {
    log("AUDIO_TRANSCRIBE_FATAL", err);
    return "Il vocale non è chiaro.";
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = transcribeAudio;
