// app/server/startup/backup-db.cjs

const fs = require("fs");
const path = require("path");

module.exports = function backupDB() {
  console.log("💾 [BACKUP] Sto effettuando il backup completo…");

  const BACKUP_DIR = "/var/data/backup";
  const DB_FILE = "/var/data/mewingmarket.db";
  const JSON_DIR = "/var/data/json";
  const UPLOADS_DIR = path.join(process.cwd(), "app/public/uploads");

  try {
    // Crea cartelle backup
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.mkdirSync(path.join(BACKUP_DIR, "db"), { recursive: true });
    fs.mkdirSync(path.join(BACKUP_DIR, "json"), { recursive: true });
    fs.mkdirSync(path.join(BACKUP_DIR, "uploads"), { recursive: true });

    // Backup DB
    if (fs.existsSync(DB_FILE)) {
      fs.copyFileSync(DB_FILE, path.join(BACKUP_DIR, "db", "mewingmarket.db"));
      console.log("💾 [BACKUP] Database salvato");
    }

    // Backup JSON mirror
    if (fs.existsSync(JSON_DIR)) {
      const files = fs.readdirSync(JSON_DIR);
      for (const f of files) {
        fs.copyFileSync(
          path.join(JSON_DIR, f),
          path.join(BACKUP_DIR, "json", f)
        );
      }
      console.log("💾 [BACKUP] JSON mirror salvati");
    }

    // Backup uploads (immagini, file)
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const f of files) {
        fs.copyFileSync(
          path.join(UPLOADS_DIR, f),
          path.join(BACKUP_DIR, "uploads", f)
        );
      }
      console.log("💾 [BACKUP] Uploads salvati");
    }

    // Timestamp
    fs.writeFileSync(
      path.join(BACKUP_DIR, "timestamp.txt"),
      new Date().toISOString(),
      "utf8"
    );

    console.log("✅ [BACKUP] Backup completato");

  } catch (err) {
    console.error("❌ [BACKUP] Errore:", err.message);
  }
};
