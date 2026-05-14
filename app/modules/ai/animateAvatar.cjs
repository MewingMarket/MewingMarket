/**
 * FILE: animateAvatar.cjs
 * PATH: /app/modules/ai/animateAvatar.cjs
 * DESC: Prende un PNG del bot e genera un "avatar parlante" (stub).
 */

const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(process.cwd(), "app/public/tutorials/avatar");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * animateAvatar
 * Qui in futuro collegherai un vero modello di lip-sync.
 * Ora crea solo un MP4 vuoto come stub.
 */
async function animateAvatar(avatarPngPath, audioPath, avatarKey, guideKey) {
  ensureDir(OUTPUT_DIR);

  const safeGuide = String(guideKey || "guida").replace(/[^a-z0-9\-]/gi, "_");
  const safeAvatar = String(avatarKey || "generic").replace(/[^a-z0-9\-]/gi, "_");

  const fileName = `avatar_${safeAvatar}_${safeGuide}.mp4`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      `AVATAR VIDEO PLACEHOLDER\navatar=${avatarPngPath}\naudio=${audioPath}`,
      "utf8"
    );
  }

  const publicPath = `/tutorials/avatar/${fileName}`;
  return {
    filePath,
    publicPath
  };
}

module.exports = {
  animateAvatar
};
