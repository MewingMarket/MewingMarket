/**
 * app/server/modules/audio.cjs
 * Trascrizione audio → testo (Whisper via OpenRouter)
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

/**
 * Trascrive un file audio usando Whisper tramite OpenRouter
 * @param {string} filePath - percorso del file audio
 * @returns {Promise<string>}
 */
async function transcribeAudio(filePath) {
  try {
    if (typeof global.logEvent === "function") {
      global.logEvent("audio_transcription_start", { filePath });
    }

    // Se manca la chiave → non crashare
    if (!process.env.OPENROUTER_API_KEY) {
      if (typeof global.logEvent === "function") {
        global.logEvent("audio_transcription_missing_key", {});
      }
      return "";
    }

    const fileStream = fs.createReadStream(filePath);

    const formData = new FormData();
    formData.append("file", fileStream);
    formData.append("model", "openai/whisper-1");
    formData.append("response_format", "text");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      formData,
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          ...formData.getHeaders()
        },
        timeout: 60000
      }
    );

    const text = response?.data || "";

    if (typeof global.logEvent === "function") {
      global.logEvent("audio_transcription_ok", { text });
    }

    return text;

  } catch (err) {
    console.error("Errore transcribeAudio:", err);

    if (typeof global.logEvent === "function") {
      global.logEvent("audio_transcription_error", {
        error: err?.message || "unknown"
      });
    }

    return "";
  }
}

module.exports = {
  transcribeAudio
};
