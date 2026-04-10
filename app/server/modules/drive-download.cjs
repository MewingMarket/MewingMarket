/* FILE: app/server/modules/drive-download.cjs
 * Scarica un file ZIP dalla cartella Drive dei backup
 * Modalità SAFE — compatibile con GOOGLE_APPLICATION_CREDENTIALS (Secret File JSON)
 */

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const DRIVE_FOLDER_BACKUP = process.env.DRIVE_FOLDER_BACKUP;

// =========================================================
// SAFE MODE: se non c’è GOOGLE_APPLICATION_CREDENTIALS → skip
// =========================================================
function getDriveClient() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log("⚠️ Drive non configurato (manca GOOGLE_APPLICATION_CREDENTIALS)");
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/drive.readonly"]
    });

    return google.drive({ version: "v3", auth });
  } catch (err) {
    console.error("❌ Errore inizializzazione GoogleAuth:", err.message);
    return null;
  }
}

async function downloadDrive(folderId) {
  try {
    const drive = getDriveClient();
    if (!drive) return null;

    const list = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/zip'`,
      orderBy: "createdTime desc",
      pageSize: 1
    });

    const file = list.data.files?.[0];
    if (!file) {
      console.log("⚠️ Nessun file ZIP trovato su Drive");
      return null;
    }

    const dest = `/tmp/${file.name}`;
    const destStream = fs.createWriteStream(dest);

    const res = await drive.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "stream" }
    );

    await new Promise((resolve, reject) => {
      res.data
        .on("end", resolve)
        .on("error", reject)
        .pipe(destStream);
    });

    console.log("📥 [DRIVE] File scaricato:", file.name);
    return dest;

  } catch (err) {
    console.error("❌ Errore download Drive:", err.message);
    return null;
  }
}

module.exports = downloadDrive;
