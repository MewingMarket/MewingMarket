// app/server/startup/restore-db.cjs

const fs = require("fs");
const path = require("path");

module.exports = function restoreDB() {
  console.log("♻️ [RESTORE] Controllo se serve ripristinare il database…");

  const BACKUP_DIR = "/var/data/backup";
  const DB_FILE = "/var/data/mewingmarket.db";
  const JSON_DIR = "/var/data/json";
  const UPLOADS_DIR = path.join(process.cwd(), "app/public/uploads");

  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log("📭 [RESTORE] Nessun backup trovato");
      return;
    }

    // Se il DB esiste ed è > 0 byte → non ripristinare
    if (fs.existsSync(DB_FILE) && fs.statSync(DB_FILE).size > 0) {
      console.log("📌 [RESTORE] DB presente, nessun ripristino necessario");
      return;
    }

    console.log("♻️ [RESTORE] Sto effettuando il ripristino completo…");

    // Ripristina DB
    const backupDB = path.join(BACKUP_DIR, "db", "mewingmarket.db");
    if (fs.existsSync(backupDB)) {
      fs.copyFileSync(backupDB, DB_FILE);
      console.log("♻️ [RESTORE] Database ripristinato");
    }

    // Ripristina JSON
    const backupJSON = path.join(BACKUP_DIR, "json");
    if (fs.existsSync(backupJSON)) {
      const files = fs.readdirSync(backupJSON);
      for (const f of files) {
        fs.copyFileSync(
          path.join(backupJSON, f),
          path.join(JSON_DIR, f)
        );
      }
      console.log("♻️ [RESTORE] JSON ripristinati");
    }

    // Ripristina uploads
    const backupUploads = path.join(BACKUP_DIR, "uploads");
    if (fs.existsSync(backupUploads)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      const files = fs.readdirSync(backupUploads);
      for (const f of files) {
        fs.copyFileSync(
          path.join(backupUploads, f),
          path.join(UPLOADS_DIR, f)
        );
      }
      console.log("♻️ [RESTORE] Uploads ripristinati");
    }

    console.log("✅ [RESTORE] Ripristino completato");

  } catch (err) {
    console.error("❌ [RESTORE] Errore:", err.message);
  }
};
