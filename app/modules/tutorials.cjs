/**
 * FILE: tutorials.cjs
 * PATH: /app/modules/tutorials.cjs
 * DESC: Orchestratore: guida → script → voce → avatar → video finale.
 */

const path = require("path");
const { generateVideoScript } = require(path.join(process.cwd(), "app/modules/ai/generateVideoScript.cjs"));
const { generateVoice } = require(path.join(process.cwd(), "app/modules/ai/generateVoice.cjs"));
const { animateAvatar } = require(path.join(process.cwd(), "app/modules/ai/animateAvatar.cjs"));
const { renderTutorialVideo } = require(path.join(process.cwd(), "app/modules/ai/renderTutorialVideo.cjs"));

/**
 * Mappa avatarKey → PNG nel tuo /public/videogioco
 */
const AVATAR_PNG_MAP = {
  vendor_male: "/videogioco/uomo manager.png",
  vendor_female: "/videogioco/donna manager.png",
  influencer_male: "/videogioco/influencer uomo.png",
  influencer_female: "/videogioco/influencer donna.png",
  professor_male: "/videogioco/professore.png",
  professor_female: "/videogioco/professoressa.png",
  newsletter_male: "/videogioco/postino.png",
  newsletter_female: "/videogioco/postina.png",
  generic_male: "/videogioco/uomo saggio.png",
  generic_female: "/videogioco/donna saggia.png"
};

/**
 * getAvatarPng
 */
function getAvatarPng(botAvatar, gender) {
  const key = `${botAvatar}_${gender === "female" ? "female" : "male"}`;
  return AVATAR_PNG_MAP[key] || AVATAR_PNG_MAP["generic_male"];
}

/**
 * createTutorialForGuide
 * guideKey: slug della guida (es: "come-scaricare-un-prodotto")
 * guideText: testo della guida/FAQ
 * botAvatar: "vendor" | "influencer" | "professor" | "newsletter" | "generic"
 * gender: "male" | "female"
 */
async function createTutorialForGuide(guideKey, guideText, botAvatar, gender) {
  const script = generateVideoScript(guideText, {
    title: guideKey.replace(/-/g, " ")
  });

  const voice = await generateVoice(script.voiceover, botAvatar, guideKey);

  const avatarPng = getAvatarPng(botAvatar, gender);
  const avatarVideo = await animateAvatar(avatarPng, voice.filePath, botAvatar, guideKey);

  const tutorial = await renderTutorialVideo({
    guideKey,
    avatarKey: botAvatar,
    script,
    voice,
    avatarVideo
  });

  return tutorial.publicPath;
}

module.exports = {
  createTutorialForGuide
};
