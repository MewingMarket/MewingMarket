// =========================================================
// File: app/server/routes/api-upload.cjs
// Upload immagini + file prodotto (salvataggio locale)
// =========================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Percorsi cartelle upload
const uploadBase = path.join(__dirname, "..", "uploads");
const uploadImages = path.join(uploadBase, "images");
const uploadFiles = path.join(uploadBase, "files");

// Creazione cartelle se non esistono
fs.mkdirSync(uploadImages, { recursive: true });
fs.mkdirSync(uploadFiles, { recursive: true });

// Storage dinamico
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (req.uploadType === "image") cb(null, uploadImages);
    else cb(null, uploadFiles);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

// Middleware per distinguere tipo upload
function setUploadType(type) {
  return (req, res, next) => {
    req.uploadType = type;
    next();
  };
}

// =========================================================
// UPLOAD IMMAGINE
// =========================================================
router.post("/upload/immagine", setUploadType("image"), upload.single("file"), (req, res) => {
  if (!req.file) return res.json({ success: false, error: "Nessun file ricevuto" });

  const url = `https://www.mewingmarket.it/uploads/images/${req.file.filename}`;

  return res.json({ success: true, url });
});

// =========================================================
// UPLOAD FILE PRODOTTO
// =========================================================
router.post("/upload/file", setUploadType("file"), upload.single("file"), (req, res) => {
  if (!req.file) return res.json({ success: false, error: "Nessun file ricevuto" });

  const url = `https://www.mewingmarket.it/uploads/files/${req.file.filename}`;

  return res.json({ success: true, url });
});

module.exports = router;
