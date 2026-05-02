/**
 * ============================================================
 * PATCHER UNIVERSALE — MewingMarket
 * Node.js — Scansione HTML e rimozione script NON loader
 * Versione SENZA generazione loader-pagine.js
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const ROOT  = path.join(__dirname, "app/public");
const ADMIN = path.join(ROOT, "admin");

const PUBLIC_LOADERS = ["loader.js", "dynamic-loader.js"];
const ADMIN_LOADERS  = ["loader-admin.js", "dynamic-admin-loader.js"];

/* ============================================================
   Utility
============================================================ */
function readHTML(file) {
  return fs.readFileSync(file, "utf8");
}

function writeHTML(file, content) {
  fs.writeFileSync(file, content, "utf8");
}

function listHTML(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".html"))
    .map(f => path.join(dir, f));
}

function extractScripts(html) {
  const regex = /<script[^>]+src="([^"]+)"/g;
  const out = [];
  let m;
  while ((m = regex.exec(html)) !== null) out.push(m[1]);
  return out;
}

function isLoader(src, isAdmin) {
  const base = src.split("?")[0].split("/").pop();
  return isAdmin ? ADMIN_LOADERS.includes(base) : PUBLIC_LOADERS.includes(base);
}

/* ============================================================
   Processa una cartella (public o admin)
============================================================ */
function processFolder(dir, isAdmin = false) {
  const htmlFiles = listHTML(dir);

  for (const file of htmlFiles) {
    let html = readHTML(file);
    const scripts = extractScripts(html);

    for (const src of scripts) {
      if (!isLoader(src, isAdmin)) {
        // Rimuovi script non loader
        const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(
          `<script[^>]+src="${escaped}"[^>]*>\\s*</script>`,
          "g"
        );
        html = html.replace(re, "");
      }
    }

    writeHTML(file, html);
    console.log("✔ Patchato:", file.replace(ROOT, ""));
  }
}

/* ============================================================
   ESECUZIONE
============================================================ */
console.log("=== PATCHER UNIVERSALE (NO loader-pagine) ===");

processFolder(ROOT, false);
processFolder(ADMIN, true);

console.log("=== COMPLETATO ===");
