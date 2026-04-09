/* FILE: app/server/modules/github-download.cjs
 * Scarica il backup ZIP dal repository GitHub
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // es: "SimoneDev/mewing-backup"

async function downloadGitHub() {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      console.error("❌ GitHub non configurato");
      return null;
    }

    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

    const release = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    const asset = release.data.assets?.find(a => a.name.endsWith(".zip"));
    if (!asset) return null;

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

    return dest;

  } catch (err) {
    console.error("❌ Errore download GitHub:", err.message);
    return null;
  }
}

module.exports = downloadGitHub;
