/**
 * =========================================================
 * File: app/server/routes/api-upload.cjs
 * Upload File Prodotto — Versione 2026.99
 * - Salva SOLO filename nel DB
 * - Log avanzati
 * - Compatibile con download backend
 * =========================================================
 */

const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

// Middleware per tipo upload
const setUploadType = require("../middleware/upload-type.cjs");

// Cartella upload
const uploadFiles = path.join(__dirname, "../public/uploads");

/**
 * =========================================================
 * POST /upload/file
 * Upload file prodotto (pdf, zip, mp4, immagini)
 * =========================================================
 */
router.post("/upload/file", setUploadType("file"), (req, res) => {
  try {
    // Nome file unico
    const filename = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // Estensione dal Content-Type
    const contentType = req.headers["content-type"] || "";
    let ext = "";

    if (contentType.includes("pdf")) ext = ".pdf";
    if (contentType.includes("zip")) ext = ".zip";
    if (contentType.includes("mp4")) ext = ".mp4";
    if (contentType.includes("jpeg")) ext = ".jpg";
    if (contentType.includes("png")) ext = ".png";

    const finalName = filename + ext;

    // Percorso finale su Render
    const filePath = path.join(uploadFiles, finalName);

    console.log("📁 Upload file prodotto →", finalName);
    console.log("📂 Percorso finale →", filePath);

    // Stream su disco
    const writeStream = fs.createWriteStream(filePath);
    req.pipe(writeStream);

    writeStream.on("finish", () => {
      // Restituiamo SOLO il filename
      return res.json({
        success: true,
        filename: finalName
      });
    });

    writeStream.on("error", (err) => {
      console.error("❌ Errore stream upload:", err);
      return res.json({ success: false, error: "Errore scrittura file" });
    });

  } catch (err) {
    console.error("❌ Errore upload:", err);
    return res.json({ success: false, error: "Errore upload" });
  }
});

module.exports = router;
