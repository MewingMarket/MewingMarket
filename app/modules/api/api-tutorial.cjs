/**
 * FILE: api-tutorial.cjs
 * PATH: /app/modules/api/api-tutorial.cjs
 * DESC: API REST Tutorial AI (Professore Bot + Video AI 2027)
 */

const express = require("express");
const router = express.Router();

const tutorialDB = require("../tutorial/tutorial.cjs");
const tutorialsAI = require("../tutorials.cjs");

/* ============================================================
   GET TUTORIAL (solo testo + video se esiste)
============================================================ */
router.post("/get", async (req, res) => {
  try {
    const { slug } = req.body;

    if (!slug) {
      return res.json({
        success: false,
        error: "Slug mancante."
      });
    }

    const data = await tutorialDB.getTutorial(slug);

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("API_TUTORIAL_GET_ERROR", err);
    return res.json({
      success: false,
      error: "Errore interno."
    });
  }
});

/* ============================================================
   LISTA TUTORIAL
============================================================ */
router.post("/list", async (req, res) => {
  try {
    const data = await tutorialDB.listTutorials();

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("API_TUTORIAL_LIST_ERROR", err);
    return res.json({
      success: false,
      error: "Errore interno."
    });
  }
});

/* ============================================================
   GENERA VIDEO TUTORIAL (PATCH 2027)
   - Professore Bot → Intent Engine → tutorial.guideKey
   - Genera script → voce → avatar → video finale
   - Salva nel DB tutorial
============================================================ */
router.post("/generate", async (req, res) => {
  try {
    const { slug, text, avatar = "professor", gender = "male" } = req.body;

    if (!slug || !text) {
      return res.json({
        success: false,
        error: "Parametri mancanti (slug, text)."
      });
    }

    const videoUrl = await tutorialsAI.createTutorialForGuide(
      slug,
      text,
      avatar,
      gender
    );

    return res.json({
      success: true,
      video_url: videoUrl
    });
  } catch (err) {
    console.error("API_TUTORIAL_GENERATE_ERROR", err);
    return res.json({
      success: false,
      error: "Errore generazione tutorial."
    });
  }
});

module.exports = router;
