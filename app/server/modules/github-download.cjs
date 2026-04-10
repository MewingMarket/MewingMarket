/* FILE: app/server/modules/github-download.cjs
 * Scarica il backup ZIP dal repository GitHub — Modalità SAFE
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

async function downloadGitHub() {
  if (!githubConfigured()) return null;

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

    const release = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    const asset = release.data.assets?.find(a => a.name.endsWith(".zip"));
    if (!asset) {
      console.log("⚠️ Nessun asset ZIP trovato nella release GitHub");
      return null;
    }

    const dest = `/tmp/${asset.name}`;
    const writer = fs.createWriteStream(dest);

    const download = await axios.get(asset.browser_download_url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
      responseType: "stream"
    });

    await new Promise((resolve, reject) => {
      download.data
        .pipe(writer)
        .on("finish", resolve)
        .on("error", reject);
    });

    console.log("📥 [GITHUB] Backup scaricato:", asset.name);
    return dest;

  } catch (err) {
    console.error("❌ Errore download GitHub:", err?.response?.data || err.message);
    return null;
  }
}

module.exports = downloadGitHub;
