/* =========================================================
   FILE: app/server/routes/api-upload.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Upload file prodotto (pdf, zip, mp4, immagini)
   ORIGINALE: ex POST /upload/file
========================================================= */

const path = require("path");
const fs = require("fs");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

// Middleware originale (ora funzione da chiamare manualmente)
const setUploadType = R("middleware/upload-type.cjs");

// PATCH 2026 — CARTELLA UPLOAD DEFINITIVA
const uploadFiles = "/var/data/uploads/files";

/* =========================================================
   FUNZIONE: uploadFileProdotto
   (ex POST /upload/file)
========================================================= */
async function uploadFileProdotto(req, res) {
  try {
    // Applica il middleware originale (Java‑mode)
    await setUploadType("file")(req, res, () => {});

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

    // Percorso finale assoluto
    const filePath = path.join(uploadFiles, finalName);

    console.log("📁 Upload file prodotto →", finalName);
    console.log("📂 Percorso finale →", filePath);

    // Assicura che la cartella esista
    try {
      fs.mkdirSync(uploadFiles, { recursive: true });
    } catch (err) {
      console.error("❌ Errore creazione cartella upload:", err);
    }

    // Stream su disco
    const writeStream = fs.createWriteStream(filePath);
    req.pipe(writeStream);

    writeStream.on("finish", () => {
      res.json({
        success: true,
        filename: finalName
      });
    });

    writeStream.on("error", (err) => {
      console.error("❌ Errore stream upload:", err);
      res.json({ success: false, error: "Errore scrittura file" });
    });

  } catch (err) {
    console.error("❌ Errore uploadFileProdotto:", err);
    res.json({ success: false, error: "Errore upload" });
  }
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  uploadFileProdotto
};
