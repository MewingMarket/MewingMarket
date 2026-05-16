/**
 * FILE: api-tutorial.cjs
 * PATH: /app/modules/api/api-tutorial.cjs
 * DESC: API REST Tutorial AI (Professore Bot)
 */

const express = require("express");
const router = express.Router();
const tutorial = require("../tutorial/tutorial.cjs");

router.post("/get", async (req, res) => {
  const { slug } = req.body;
  const data = await tutorial.getTutorial(slug);
  res.json({ success: true, data });
});

router.post("/list", async (req, res) => {
  const data = await tutorial.listTutorials();
  res.json({ success: true, data });
});

module.exports = router;
