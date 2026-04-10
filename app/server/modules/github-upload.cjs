/* FILE: app/server/modules/github-upload.cjs
 * Upload ZIP backup su GitHub Releases — Modalità SAFE
 * Compatibile con backup.cjs — 2026
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // es: "SimoneDev/mewing-backup"

// =========================================================
// SAFE MODE: se GitHub non è configurato → skip
// =========================================================
function githubConfigured() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log("⚠️ GitHub non configurato → skip");
    return false;
  }
  return true;
}

/**
 * =========================================================
 * Crea una release se non esiste
 * =========================================================
 */
async function ensureRelease() {
  if (!githubConfigured()) return null;

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

    const res = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    return res.data.id;

  } catch (err) {
    // Se non esiste → creiamo una nuova release
    if (err?.response?.status === 404) {
      console.log("📦 [GITHUB] Nessuna release trovata → creazione…");

      const createUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

      try {
        const res = await axios.post(
          createUrl,
          {
            tag_name: "backup-latest",
            name: "Backup Latest",
            body: "Backup automatico generato dal sistema",
            draft: false,
            prerelease: false
          },
          { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
        );

        return res.data.id;
      } catch (err2) {
        console.error("❌ Errore creazione release GitHub:", err2?.response?.data || err2.message);
        return null;
      }
    }

    console.error("❌ Errore ensureRelease:", err?.response?.data || err.message);
    return null;
  }
}

/**
 * =========================================================
 * Upload asset ZIP alla release
 * =========================================================
 */
async function uploadToGitHub(filePath) {
  if (!githubConfigured()) return null;

  try {
    if (!fs.existsSync(filePath)) {
      console.error("❌ File ZIP non trovato:", filePath);
      return null;
    }

    const releaseId = await ensureRelease();
    if (!releaseId) {
      console.error("❌ Impossibile ottenere/creare release GitHub");
      return null;
    }

    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const uploadUrl = `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`;

    const res = await axios.post(uploadUrl, fileData, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/zip",
        "Content-Length": fileData.length
      }
    });

    console.log("📤 [GITHUB] Backup caricato:", fileName);
    return res.data.browser_download_url;

  } catch (err) {
    console.error("❌ Errore upload GitHub:", err?.response?.data || err.message);
    return null;
  }
}

module.exports = uploadToGitHub;
