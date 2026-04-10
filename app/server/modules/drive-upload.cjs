/* FILE: app/server/modules/drive-upload.cjs
 * Upload ZIP su Google Drive — Modalità SAFE
 * Compatibile con GOOGLE_APPLICATION_CREDENTIALS (Secret File JSON)
 */

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const DRIVE_FOLDER_BACKUP = process.env.DRIVE_FOLDER_BACKUP;

// =========================================================
// SAFE MODE: se manca GOOGLE_APPLICATION_CREDENTIALS → skip
// =========================================================
function getDriveClient() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log("⚠️ Drive non configurato (manca GOOGLE_APPLICATION_CREDENTIALS)");
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/drive.file"]
    });

    return google.drive({ version: "v3", auth });
  } catch (err) {
    console.error("❌ Errore inizializzazione GoogleAuth:", err.message);
    return null;
  }
}

async function uploadToDrive(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error("❌ File ZIP non trovato:", filePath);
      return null;
    }

    if (!DRIVE_FOLDER_BACKUP) {
      console.log("⚠️ Drive: manca DRIVE_FOLDER_BACKUP → skip");
      return null;
    }

    const drive = getDriveClient();
    if (!drive) return null;

    const fileName = path.basename(filePath);

    const fileMetadata = {
      name: fileName,
      parents: [DRIVE_FOLDER_BACKUP]
    };

    const media = {
      mimeType: "application/zip",
      body: fs.createReadStream(filePath)
    };

    const res = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id"
    });

    console.log("📤 [DRIVE] Backup caricato:", fileName, "→ ID:", res.data.id);
    return res.data.id;

  } catch (err) {
    console.error("❌ Errore upload Drive:", err.message);
    return null;
  }
}

module.exports = uploadToDrive;
