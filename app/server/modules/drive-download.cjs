/* FILE: app/server/modules/drive-download.cjs
 * Scarica un file ZIP dalla cartella Drive dei backup
 */

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const DRIVE_FOLDER_BACKUP = process.env.DRIVE_FOLDER_BACKUP;
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

if (!GOOGLE_SERVICE_ACCOUNT || !GOOGLE_PRIVATE_KEY) {
  console.error("❌ Google Drive non configurato");
}

function getDriveClient() {
  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT,
    null,
    GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/drive.readonly"]
  );
  return google.drive({ version: "v3", auth });
}

async function downloadDrive(folderId) {
  try {
    const drive = getDriveClient();

    const list = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/zip'`,
      orderBy: "createdTime desc",
      pageSize: 1
    });

    const file = list.data.files?.[0];
    if (!file) return null;

    const dest = `/tmp/${file.name}`;
    const destStream = fs.createWriteStream(dest);

    await drive.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "stream" }
    ).then(res => {
      return new Promise((resolve, reject) => {
        res.data
          .on("end", resolve)
          .on("error", reject)
          .pipe(destStream);
      });
    });

    return dest;

  } catch (err) {
    console.error("❌ Errore download Drive:", err.message);
    return null;
  }
}

module.exports = downloadDrive;
