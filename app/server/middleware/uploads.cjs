/**
 * app/server/middleware/uploads.cjs
 * Gestione upload file (Multer) + endpoint /chat/upload
 */

const path = require("path");
const fs = require("fs");
const multer = require("multer");

module.exports = function (app) {
  const ROOT = path.resolve(__dirname, "..", "..");

  const uploadDir = path.join(ROOT, "public", "uploads");

  // Creazione cartella uploads
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("📁 Cartella uploads creata:", uploadDir);
    } catch (err) {
      console.error("Errore creazione cartella uploads:", err);
    }
  }

  // Configurazione Multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        cb(null, uploadDir);
      } catch (err) {
        console.error("Errore destination multer:", err);
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      try {
        const ext = path.extname(file.originalname || "");
        cb(null, "upload_" + Date.now() + ext);
      } catch (err) {
        console.error("Errore filename multer:", err);
        cb(err);
      }
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
  });

  /* =========================================================
     ENDPOINT UPLOAD FILE CHAT
  ========================================================== */
  app.post("/chat/upload", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.json({ error: "Nessun file ricevuto" });
      }

      const fileUrl = "/uploads/" + req.file.filename;

      // logEvent viene importato dal server principale
      if (typeof global.logEvent === "function") {
        global.logEvent("chat_file_uploaded", { fileUrl });
      }

      return res.json({ fileUrl });

    } catch (err) {
      console.error("Errore /chat/upload:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("chat_file_upload_error", { error: err?.message || "unknown" });
      }

      return res.json({ error: "Errore durante il caricamento del file" });
    }
  });
};
