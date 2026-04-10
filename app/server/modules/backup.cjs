/* FILE: app/server/modules/backup.cjs
 * Backup 2026 — Modalità SAFE + HASH + LOG
 * - Drive → GitHub → Locale
 * - Nessun crash se Drive/GitHub non configurati
 * - Log in backups_log + JSON mirror
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Email
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { LISTA_BACKUP } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));

// Drive + GitHub
const uploadDrive = require(path.join(process.cwd(), "app/server/modules/drive-upload.cjs"));
const uploadGitHub = require(path.join(process.cwd(), "app/server/modules/github-upload.cjs"));

// DB (per log backups_log)
let db = null;
try {
  db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
} catch {
  db = null;
}

// Cartelle Drive
const DRIVE_FOLDER_BACKUP = process.env.DRIVE_FOLDER_BACKUP;
const DRIVE_FOLDER_REPORT = process.env.DRIVE_FOLDER_REPORT;
const DRIVE_FOLDER_RECEIPTS = process.env.DRIVE_FOLDER_RECEIPTS;

// Percorsi locali
const BACKUP_DIR = "/var/data/backup";
const DB_FILE = "/var/data/mewingmarket.db";
const JSON_DIR = "/var/data/json";
const UPLOADS_DIR = path.join(process.cwd(), "app/public/uploads");
const STATE_FILE = path.join(BACKUP_DIR, "state.json");
const BACKUPS_JSON = path.join(JSON_DIR, "backups.json");

// =========================================================
// HELPER: HASH DB
// =========================================================
function getDbHash() {
  if (!fs.existsSync(DB_FILE)) return null;
  const buffer = fs.readFileSync(DB_FILE);
  return crypto.createHash("md5").update(buffer).digest("hex");
}

// =========================================================
// HELPER: STATE (ultimo hash)
// =========================================================
function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

// =========================================================
// 1) BACKUP LOCALE
// =========================================================
function backupLocale() {
  console.log("💾 [BACKUP] Mirror locale…");

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.mkdirSync(path.join(BACKUP_DIR, "db"), { recursive: true });
  fs.mkdirSync(path.join(BACKUP_DIR, "json"), { recursive: true });
  fs.mkdirSync(path.join(BACKUP_DIR, "uploads"), { recursive: true });

  if (fs.existsSync(DB_FILE)) {
    fs.copyFileSync(DB_FILE, path.join(BACKUP_DIR, "db", "mewingmarket.db"));
  }

  if (fs.existsSync(JSON_DIR)) {
    for (const f of fs.readdirSync(JSON_DIR)) {
      fs.copyFileSync(path.join(JSON_DIR, f), path.join(BACKUP_DIR, "json", f));
    }
  }

  if (fs.existsSync(UPLOADS_DIR)) {
    for (const f of fs.readdirSync(UPLOADS_DIR)) {
      fs.copyFileSync(path.join(UPLOADS_DIR, f), path.join(BACKUP_DIR, "uploads", f));
    }
  }

  fs.writeFileSync(path.join(BACKUP_DIR, "timestamp.txt"), new Date().toISOString(), "utf8");

  console.log("💾 [BACKUP] Mirror locale completato");
}

// =========================================================
// 2) CREA ZIP
// =========================================================
function creaZip(nome, dir) {
  const { execSync } = require("child_process");
  const zipPath = path.join("/tmp", nome);

  execSync(`cd ${dir} && zip -r ${zipPath} .`, { stdio: "ignore" });

  return zipPath;
}

// =========================================================
// 3) EMAIL
// =========================================================
async function inviaBackupEmail({ filename, base64 }) {
  try {
    await inviaEmailLista({
      email: "mewingmarket2@gmail.com",
      listId: LISTA_BACKUP,
      subject: `Backup: ${filename}`,
      html: `<p>Backup generato correttamente.</p>`,
      attachments: [
        {
          name: filename,
          content: base64,
          type: "application/zip"
        }
      ],
      tipo: "backup",
      modalita: "backup"
    });

    console.log("📨 [BACKUP] Email inviata");
  } catch (err) {
    console.error("❌ [BACKUP] Errore invio email:", err.message);
  }
}

// =========================================================
// 4) LOG IN TABELLA backups_log + JSON mirror
// =========================================================
function logBackup({ source, hash, sizeBytes, filename }) {
  try {
    if (!db) {
      console.log("⚠️ [BACKUP] DB non disponibile per log backups_log");
      return;
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO backups_log (created_at, source, hash, size_bytes, filename)
      VALUES (?, ?, ?, ?, ?)
    `).run(now, source || "unknown", hash || "", sizeBytes || 0, filename || "");

    // JSON mirror
    fs.mkdirSync(JSON_DIR, { recursive: true });
    const rows = db.prepare(`
      SELECT id, created_at, source, hash, size_bytes, filename
      FROM backups_log
      ORDER BY id DESC
    `).all();
    fs.writeFileSync(BACKUPS_JSON, JSON.stringify(rows, null, 2), "utf8");

    console.log("📑 [BACKUP] Log aggiornato + JSON mirror");
  } catch (err) {
    console.error("❌ [BACKUP] Errore log backups_log:", err.message);
  }
}

// =========================================================
// 5) BACKUP GENERALE (SAFE MODE + HASH)
// =========================================================
async function backupGenerale(options = {}) {
  const source = options.source || "manual";
  const force = Boolean(options.force);

  console.log(`💾 [BACKUP] Backup generale… (source=${source}, force=${force})`);

  const hash = getDbHash();
  const state = loadState();

  if (!force && hash && state.lastHash === hash) {
    console.log("⏳ [BACKUP] Nessuna modifica DB rispetto all'ultimo backup → skip");
    return;
  }

  backupLocale();

  const nome = `backup-${Date.now()}.zip`;
  const zipPath = creaZip(nome, BACKUP_DIR);
  const buffer = fs.readFileSync(zipPath);
  const base64 = buffer.toString("base64");
  const sizeBytes = buffer.length;

  // DRIVE (SAFE)
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && DRIVE_FOLDER_BACKUP) {
      await uploadDrive(zipPath, DRIVE_FOLDER_BACKUP);
    } else {
      console.log("⚠️ [BACKUP] Drive non configurato → skip");
    }
  } catch (err) {
    console.error("❌ [BACKUP] Errore Drive:", err.message);
  }

  // GITHUB (SAFE)
  try {
    if (process.env.GITHUB_TOKEN) {
      await uploadGitHub(zipPath, nome);
    } else {
      console.log("⚠️ [BACKUP] GitHub non configurato → skip");
    }
  } catch (err) {
    console.error("❌ [BACKUP] Errore GitHub:", err.message);
  }

  // EMAIL
  await inviaBackupEmail({ filename: nome, base64 });

  // STATE + LOG
  const newState = {
    lastHash: hash || null,
    lastAt: new Date().toISOString(),
    lastFile: nome
  };
  saveState(newState);
  logBackup({ source, hash, sizeBytes, filename: nome });

  console.log("✅ [BACKUP] Backup generale completato");
}

// =========================================================
// 6) BACKUP RICEVUTA
// =========================================================
async function backupRicevuta({ numeroOrdine, pdfInterno }) {
  console.log("🧾 [BACKUP] Ricevuta…");

  const filename = `ricevuta-${numeroOrdine}.pdf`;
  const localPath = path.join(BACKUP_DIR, "ricevute", filename);

  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, Buffer.from(pdfInterno, "base64"));

  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && DRIVE_FOLDER_RECEIPTS) {
      await uploadDrive(localPath, DRIVE_FOLDER_RECEIPTS);
    } else {
      console.log("⚠️ [BACKUP] Drive non configurato → skip");
    }
  } catch (err) {
    console.error("❌ [BACKUP] Errore Drive:", err.message);
  }

  await inviaBackupEmail({ filename, base64: pdfInterno });

  console.log("✅ [BACKUP] Ricevuta salvata");
}

// =========================================================
// 7) BACKUP REPORT
// =========================================================
async function backupReport({ kpi }) {
  console.log("📊 [BACKUP] Report…");

  const mese = kpi.mese || "ultimo";
  const jsonPath = path.join("/tmp", `report-${mese}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(kpi, null, 2));

  const zipName = `report-${mese}.zip`;
  const zipPath = creaZip(zipName, "/tmp");
  const base64 = fs.readFileSync(zipPath).toString("base64");

  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && DRIVE_FOLDER_REPORT) {
      await uploadDrive(zipPath, DRIVE_FOLDER_REPORT);
    } else {
      console.log("⚠️ [BACKUP] Drive non configurato → skip");
    }
  } catch (err) {
    console.error("❌ [BACKUP] Errore Drive:", err.message);
  }

  await inviaBackupEmail({ filename: zipName, base64 });

  console.log("✅ [BACKUP] Report salvato");
}

// =========================================================
// 8) DISPATCHER
// =========================================================
async function backup(tipo, payload = {}) {
  if (tipo === "ricevuta") return backupRicevuta(payload);
  if (tipo === "report") return backupReport(payload);
  return backupGenerale(payload);
}

module.exports = {
  backup,
  backupGenerale,
  backupRicevuta,
  backupReport
};
