/* FILE: app/server/modules/restore.cjs
 * Restore unico — Modalità SAFE 2026
 * - Drive → GitHub → Locale
 * - Nessun crash se Drive/GitHub non configurati
 * - Restore automatico SOLO se DB mancante o corrotto
 */

const fs = require("fs");
const path = require("path");

const downloadDrive = require(path.join(process.cwd(), "app/server/modules/drive-download.cjs"));
const downloadGitHub = require(path.join(process.cwd(), "app/server/modules/github-download.cjs"));

const BACKUP_DIR = "/var/data/backup";
const DB_FILE = "/var/data/mewingmarket.db";
const JSON_DIR = "/var/data/json";
const UPLOADS_DIR = path.join(process.cwd(), "app/public/uploads");

const DRIVE_FOLDER_BACKUP = process.env.DRIVE_FOLDER_BACKUP;

// =========================================================
// CONTROLLO INTEGRITÀ DB (corrotto / mancante)
// =========================================================
function needsRestoreAuto() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      console.log("⚠️ [RESTORE] DB file mancante → restore necessario");
      return true;
    }

    const sqlite = require("better-sqlite3");
    const db = new sqlite(DB_FILE);

    const row = db.prepare("PRAGMA integrity_check;").get();
    if (!row || !row.integrity_check || row.integrity_check !== "ok") {
      console.log("⚠️ [RESTORE] PRAGMA integrity_check fallita → restore necessario");
      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ [RESTORE] Errore controllo integrità DB:", err.message);
    return true;
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

  const localDB = path.join(BACKUP_DIR, "db", "mewingmarket.db");
  if (fs.existsSync(localDB)) {
    fs.copyFileSync(localDB, DB_FILE);
  }

  if (fs.existsSync(path.join(BACKUP_DIR, "json"))) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
    for (const f of fs.readdirSync(path.join(BACKUP_DIR, "json"))) {
      fs.copyFileSync(
        path.join(BACKUP_DIR, "json", f),
        path.join(JSON_DIR, f)
      );
    }
  }

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
// 3) RIPRISTINO DA DRIVE
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
// 4) RIPRISTINO DA GITHUB
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

    const need = needsRestoreAuto();

    if (!need) {
      console.log("⛔ [RESTORE] Saltato: database integro e presente");
      return false;
    }

    if (backupLocaleEsiste()) {
      console.log("📁 [RESTORE] Backup locale trovato → uso locale");
      restoreLocale();
      return true;
    }

    try {
      await restoreFromDrive();
      return true;
    } catch (err) {
      console.error("⚠️ Drive non disponibile:", err.message);
    }

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
