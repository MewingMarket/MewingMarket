/**
 * app/server/modules/audio.cjs
 * Trascrizione audio → testo (Whisper)
 */

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Trascrive un file audio usando Whisper
 * @param {string} filePath - percorso del file audio
 * @returns {Promise<string>}
 */
async function transcribeAudio(filePath) {
  try {
    if (typeof global.logEvent === "function") {
      global.logEvent("audio_transcription_start", { filePath });
    }

    const fileStream = fs.createReadStream(filePath);

    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      response_format: "text"
    });

    const text = response?.trim?.() || "";

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
