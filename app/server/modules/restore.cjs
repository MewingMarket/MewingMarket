/* FILE: app/server/modules/restore.cjs
 * Restore unico — Modalità SAFE 2026
 * - Drive → GitHub → Locale
 * - Nessun crash se Drive/GitHub non configurati
 * - Compatibile con GOOGLE_APPLICATION_CREDENTIALS (Secret File JSON)
 */

const fs = require("fs");
const path = require("path");

// Moduli Drive + GitHub (SAFE MODE)
const downloadDrive = require(path.join(process.cwd(), "app/server/modules/drive-download.cjs"));
const downloadGitHub = require(path.join(process.cwd(), "app/server/modules/github-download.cjs"));

const BACKUP_DIR = "/var/data/backup";
const DB_FILE = "/var/data/mewingmarket.db";
const JSON_DIR = "/var/data/json";
const UPLOADS_DIR = path.join(process.cwd(), "app/public/uploads");

const DRIVE_FOLDER_BACKUP = process.env.DRIVE_FOLDER_BACKUP;

// =========================================================
// FUNZIONE CHIAVE: DB VUOTO?
// =========================================================
function isDatabaseEmpty() {
  try {
    // Se il file DB non esiste → consideriamo "vuoto"
    if (!fs.existsSync(DB_FILE)) {
      console.log("⚠️ [RESTORE] DB file non trovato → considerato vuoto");
      return true;
    }

    const sqlite = require("better-sqlite3");
    const db = new sqlite(DB_FILE);

    const row = db.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      LIMIT 1
    `).get();

    return !row; // true = vuoto
  } catch (err) {
    console.error("❌ Errore controllo DB vuoto:", err.message);
    return false;
  }
}

// =========================================================
// 1) CHECK BACKUP LOCALE
// =========================================================
function backupLocaleEsiste() {
  return (
    fs.existsSync(path.join(BACKUP_DIR, "db", "mewingmarket.db")) &&
    fs.existsSync(path.join(BACKUP_DIR, "json")) &&
    fs.existsSync(path.join(BACKUP_DIR, "uploads"))
  );
}

// =========================================================
// 2) RIPRISTINO DA BACKUP LOCALE
// =========================================================
function restoreLocale() {
  console.log("♻️ [RESTORE] Ripristino da backup locale…");

  // DB
  const localDB = path.join(BACKUP_DIR, "db", "mewingmarket.db");
  if (fs.existsSync(localDB)) {
    fs.copyFileSync(localDB, DB_FILE);
  }

  // JSON
  if (fs.existsSync(path.join(BACKUP_DIR, "json"))) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
    for (const f of fs.readdirSync(path.join(BACKUP_DIR, "json"))) {
      fs.copyFileSync(
        path.join(BACKUP_DIR, "json", f),
        path.join(JSON_DIR, f)
      );
    }
  }

  // Uploads
  if (fs.existsSync(path.join(BACKUP_DIR, "uploads"))) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    for (const f of fs.readdirSync(path.join(BACKUP_DIR, "uploads"))) {
      fs.copyFileSync(
        path.join(BACKUP_DIR, "uploads", f),
        path.join(UPLOADS_DIR, f)
      );
    }
  }

  console.log("✅ [RESTORE] Ripristino locale completato");
}

// =========================================================
// 3) RIPRISTINO DA DRIVE (SAFE MODE)
// =========================================================
async function restoreFromDrive() {
  console.log("☁️ [RESTORE] Tentativo restore da Google Drive…");

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !DRIVE_FOLDER_BACKUP) {
    console.log("⚠️ Drive non configurato → skip");
    throw new Error("Drive non configurato");
  }

  const zipPath = await downloadDrive(DRIVE_FOLDER_BACKUP);
  if (!zipPath) throw new Error("Nessun backup trovato su Drive");

  estraiZip(zipPath);
  restoreLocale();

  console.log("✅ [RESTORE] Ripristino da Drive completato");
}

// =========================================================
// 4) RIPRISTINO DA GITHUB (SAFE MODE)
// =========================================================
async function restoreFromGitHub() {
  console.log("🐙 [RESTORE] Tentativo restore da GitHub…");

  const zipPath = await downloadGitHub();
  if (!zipPath) throw new Error("Nessun backup trovato su GitHub");

  estraiZip(zipPath);
  restoreLocale();

  console.log("✅ [RESTORE] Ripristino da GitHub completato");
}

// =========================================================
// 5) ESTRAZIONE ZIP
// =========================================================
function estraiZip(zipPath) {
  const { execSync } = require("child_process");

  console.log("📦 [RESTORE] Estrazione ZIP…");

  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  execSync(`unzip -o ${zipPath} -d ${BACKUP_DIR}`, { stdio: "ignore" });

  console.log("📦 [RESTORE] ZIP estratto");
}

// =========================================================
// 6) DISPATCHER INTELLIGENTE — SAFE MODE 2026
// =========================================================
async function restore() {
  try {
    console.log("🔄 [RESTORE] Avvio restore…");

    const empty = isDatabaseEmpty();

    if (!empty) {
      console.log("⛔ [RESTORE] Saltato: database già popolato");
      return false;
    }

    // 1) Locale (solo se DB vuoto)
    if (backupLocaleEsiste()) {
      console.log("📁 [RESTORE] Backup locale trovato → uso locale");
      restoreLocale();
      return true;
    }

    // 2) Drive (solo se DB vuoto)
    try {
      await restoreFromDrive();
      return true;
    } catch (err) {
      console.error("⚠️ Drive non disponibile:", err.message);
    }

    // 3) GitHub (solo se DB vuoto)
    try {
      await restoreFromGitHub();
      return true;
    } catch (err) {
      console.error("⚠️ GitHub non disponibile:", err.message);
    }

    console.error("❌ [RESTORE] Nessuna fonte di backup disponibile → DB lasciato intatto");
    return false;

  } catch (err) {
    console.error("❌ [RESTORE] Errore critico:", err.message);
    return false;
  }
}

module.exports = { restore };
