/* FILE: app/server/modules/drive-upload.cjs
 * Upload ZIP backup su Google Drive (cartella backup)
 */

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const DRIVE_FOLDER_BACKUP = process.env.DRIVE_FOLDER_BACKUP;

if (!GOOGLE_SERVICE_ACCOUNT || !GOOGLE_PRIVATE_KEY || !DRIVE_FOLDER_BACKUP) {
  console.error("❌ Google Drive non configurato correttamente");
}

function getDriveClient() {
  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT,
    null,
    GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/drive.file"]
  );
  return google.drive({ version: "v3", auth });
}

async function uploadToDrive(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error("❌ File ZIP non trovato:", filePath);
      return null;
    }

    const drive = getDriveClient();

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
