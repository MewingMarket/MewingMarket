// =========================================================
// File: app/server/routes/api-upload.cjs
// Upload immagini + file prodotto (persistente su Render)
// =========================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// =========================================================
// CARTELLE PERSISTENTI SU RENDER
// =========================================================
const uploadBase = "/var/data/uploads";
const uploadImages = path.join(uploadBase, "images");
const uploadFiles = path.join(uploadBase, "files");

// Creazione cartelle se non esistono
fs.mkdirSync(uploadImages, { recursive: true });
fs.mkdirSync(uploadFiles, { recursive: true });

// =========================================================
// STORAGE MULTER (solo per immagini)
// =========================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadImages);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

const uploadImage = multer({ storage });

// Middleware per distinguere tipo upload
function setUploadType(type) {
  return (req, res, next) => {
    req.uploadType = type;
    next();
  };
}

// =========================================================
// UPLOAD IMMAGINE (multer, sicuro e leggero)
// =========================================================
router.post("/upload/immagine", setUploadType("image"), uploadImage.single("file"), (req, res) => {
  if (!req.file) return res.json({ success: false, error: "Nessun file ricevuto" });

  const url = `https://www.mewingmarket.it/uploads/images/${req.file.filename}`;
  return res.json({ success: true, url });
});

// =========================================================
// UPLOAD FILE PRODOTTO — SENZA LIMITI (STREAMING PURO)
// =========================================================
router.post("/upload/file", setUploadType("file"), (req, res) => {
  try {
    // Nome file unico
    const filename = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // Estensione dal Content-Type (se presente)
    const contentType = req.headers["content-type"] || "";
    let ext = "";

    if (contentType.includes("pdf")) ext = ".pdf";
    if (contentType.includes("zip")) ext = ".zip";
    if (contentType.includes("mp4")) ext = ".mp4";
    if (contentType.includes("jpeg")) ext = ".jpg";
    if (contentType.includes("png")) ext = ".png";

    const finalName = filename + ext;

    // Percorso finale
    const filePath = path.join(uploadFiles, finalName);

    // Stream su disco (upload illimitato)
    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on("finish", () => {
      const url = `https://www.mewingmarket.it/uploads/files/${finalName}`;
      return res.json({ success: true, url });
    });

    writeStream.on("error", (err) => {
      console.error("Errore stream upload:", err);
      return res.json({ success: false, error: "Errore scrittura file" });
    });

  } catch (err) {
    console.error("Errore upload:", err);
    return res.json({ success: false, error: "Errore upload" });
  }
});

module.exports = router;
