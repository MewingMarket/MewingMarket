// =========================================================
// File: app/server/routes/api-upload.cjs
// Upload immagini + file prodotto (salvataggio automatico)
// =========================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// UPLOAD IMMAGINE
router.post("/upload/immagine", upload.single("file"), async (req, res) => {
  const url = "/uploads/" + req.file.filename;
  res.json({ success: true, url });
});

// UPLOAD FILE PRODOTTO
router.post("/upload/file", upload.single("file"), async (req, res) => {
  const url = "/uploads/" + req.file.filename;
  res.json({ success: true, url });
});

module.exports = router;
