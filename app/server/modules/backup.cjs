/* FILE: app/server/modules/backup.cjs
 * Backup 2026 — Modalità SAFE
 * - Drive → GitHub → Locale
 * - Nessun crash se Drive/GitHub non configurati
 * - Compatibile con GOOGLE_APPLICATION_CREDENTIALS (Secret File JSON)
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

// Cartelle Drive
const DRIVE_FOLDER_BACKUP = process.env.DRIVE_FOLDER_BACKUP;
const DRIVE_FOLDER_REPORT = process.env.DRIVE_FOLDER_REPORT;
const DRIVE_FOLDER_RECEIPTS = process.env.DRIVE_FOLDER_RECEIPTS;

// Percorsi locali
const BACKUP_DIR = "/var/data/backup";
const DB_FILE = "/var/data/mewingmarket.db";
const JSON_DIR = "/var/data/json";
const UPLOADS_DIR = path.join(process.cwd(), "app/public/uploads");

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
// 4) BACKUP GENERALE (SAFE MODE)
// =========================================================
async function backupGenerale() {
  console.log("💾 [BACKUP] Backup generale…");

  backupLocale();

  const nome = `backup-${Date.now()}.zip`;
  const zipPath = creaZip(nome, BACKUP_DIR);
  const base64 = fs.readFileSync(zipPath).toString("base64");

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

  console.log("✅ [BACKUP] Backup generale completato");
}

// =========================================================
// 5) BACKUP RICEVUTA
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
// 6) BACKUP REPORT
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
// 7) DISPATCHER
// =========================================================
async function backup(tipo, payload = {}) {
  if (tipo === "ricevuta") return backupRicevuta(payload);
  if (tipo === "report") return backupReport(payload);
  return backupGenerale();
}

module.exports = {
  backup,
  backupGenerale,
  backupRicevuta,
  backupReport
};
