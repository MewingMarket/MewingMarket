/**
 * FILE: generateVoice.cjs
 * PATH: /app/modules/ai/generateVoice.cjs
 * DESC: Genera (o simula) la voce del bot in base al ruolo/avatar.
 */

const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(process.cwd(), "app/public/tutorials/audio");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * generateVoice
 * Ritorna un path audio "fittizio" pronto per essere usato dal renderer video.
 * Qui domani puoi collegare un vero TTS.
 */
async function generateVoice(voiceoverText, avatarKey, guideKey) {
  ensureDir(OUTPUT_DIR);

  const safeGuide = String(guideKey || "guida").replace(/[^a-z0-9\-]/gi, "_");
  const safeAvatar = String(avatarKey || "generic").replace(/[^a-z0-9\-]/gi, "_");

  const fileName = `voice_${safeAvatar}_${safeGuide}.mp3`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  // PLACEHOLDER: scriviamo solo un file vuoto come stub
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `VOICEOVER PLACEHOLDER\n${voiceoverText}`, "utf8");
  }

  // Path pubblico
  const publicPath = `/tutorials/audio/${fileName}`;
  return {
    filePath,
    publicPath
  };
}

module.exports = {
  generateVoice
};
