/**
 * FILE: tutorial.cjs
 * PATH: /app/modules/tutorial/tutorial.cjs
 * DESC: Wrapper DB + orchestratore video per Tutorial AI (Professore Bot)
 */

const path = require("path");

// SQL (lettura/scrittura)
const tutorialSQL = require(path.join(process.cwd(), "app/modules/tutorial/tutorial-sql.cjs"));

// Video AI (script → voce → avatar → video)
const { createTutorialForGuide } = require(path.join(process.cwd(), "app/modules/tutorials.cjs"));

/* ============================================================
   GET TUTORIAL (DB)
============================================================ */
async function getTutorial(slug) {
  if (!slug) return null;
  return await tutorialSQL.getBySlug(slug);
}

/* ============================================================
   LISTA TUTORIAL (DB)
============================================================ */
async function listTutorials() {
  return await tutorialSQL.listAll();
}

/* ============================================================
   CREA + SALVA TUTORIAL VIDEO (DB + AI)
   - guideKey: slug guida
   - guideText: testo guida
   - botAvatar: vendor | influencer | professor | newsletter | generic
   - gender: male | female
============================================================ */
async function generateAndSaveTutorial(guideKey, guideText, botAvatar, gender) {
  if (!guideKey || !guideText) {
    throw new Error("generateAndSaveTutorial: guideKey o guideText mancanti.");
  }

  // 1) Genera video AI
  const videoUrl = await createTutorialForGuide(
    guideKey,
    guideText,
    botAvatar,
    gender
  );

  // 2) Salva nel DB (se vuoi)
  // ⚠️ Il tuo tutorial-sql NON ha ancora save() → lo aggiungo qui
  if (tutorialSQL.save) {
    await tutorialSQL.save({
      slug: guideKey,
      testo: guideText,
      video_url: videoUrl
    });
  }

  return videoUrl;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  getTutorial,
  listTutorials,
  generateAndSaveTutorial
};
