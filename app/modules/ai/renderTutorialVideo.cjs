/**
 * FILE: renderTutorialVideo.cjs
 * PATH: /app/modules/ai/renderTutorialVideo.cjs
 * DESC: Monta avatar parlante + testo guida → MP4 finale (stub).
 */

const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(process.cwd(), "app/public/tutorials");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * renderTutorialVideo
 * In futuro: qui userai ffmpeg per montare davvero il video.
 * Ora: crea un file MP4 "placeholder" e ritorna l'URL pubblico.
 */
async function renderTutorialVideo(options) {
  ensureDir(OUTPUT_DIR);

  const {
    guideKey,
    avatarKey,
    script,
    voice,
    avatarVideo
  } = options;

  const safeGuide = String(guideKey || "guida").replace(/[^a-z0-9\-]/gi, "_");
  const safeAvatar = String(avatarKey || "generic").replace(/[^a-z0-9\-]/gi, "_");

  const fileName = `tutorial_${safeAvatar}_${safeGuide}.mp4`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    const payload = {
      guideKey,
      avatarKey,
      script,
      voice,
      avatarVideo
    };
    fs.writeFileSync(filePath, "TUTORIAL VIDEO PLACEHOLDER\n" + JSON.stringify(payload, null, 2));
  }

  const publicPath = `/tutorials/${fileName}`;
  return {
    filePath,
    publicPath
  };
}

module.exports = {
  renderTutorialVideo
};
