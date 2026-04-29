/* =========================================================
   FILE: app/server/routes/api-upload.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Upload file prodotto (pdf, zip, mp4, immagini)
========================================================= */

const path = require("path");
const fs = require("fs");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

// Middleware originale (ora funzione da chiamare manualmente)
const setUploadType = R("middleware/upload-type.cjs");

// PATCH — CARTELLA UPLOAD DEFINITIVA
const uploadFiles = "/var/data/uploads/files";

/* =========================================================
   FUNZIONE PRINCIPALE: uploadFileProdotto
========================================================= */
async function uploadFileProdotto(req) {
  console.log("[DEBUG upload] uploadFileProdotto() chiamato");

  try {
    // Applica il middleware originale (Java‑mode)
    await new Promise((resolve) => {
      setUploadType("file")(req, {}, resolve);
    });

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

    // STREAM SU DISCO (Java‑mode)
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      req.pipe(writeStream);

      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    return {
      success: true,
      filename: finalName
    };

  } catch (err) {
    console.error("❌ Errore uploadFileProdotto:", err);
    return { success: false, error: "Errore upload" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (il frontend chiama /api/upload/uploadFileProdotto)
========================================================= */
async function upload(req) {
  console.log("[DEBUG upload] alias upload() → uploadFileProdotto()");
  return uploadFileProdotto(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  uploadFileProdotto,
  upload
};
