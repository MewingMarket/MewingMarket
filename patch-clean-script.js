/**
 * PATCHER DEFINITIVO
 * - Rimuove script specifici dal body
 * - Mantiene solo loader-header-footer.js e tracking.js
 * - Inserisce seo.js e structured-data.js nel <head>
 * - Footer.js eliminato ovunque
 */

const fs = require("fs");
const path = require("path");

const targetDir = "app/public";

const scriptsToRemove = [
  "auth.js",
  "carrello.js",
  "header-shop.js",
  "footer.js",
  "structured-data.js",
  "seo.js"
];

const scriptsToKeepInBody = [
  "loader-header-footer.js",
  "tracking.js"
];

function processHTML(filePath) {
  let html = fs.readFileSync(filePath, "utf8");

  // 1. Rimuovi TUTTI gli script specifici dal body
  scriptsToRemove.forEach(script => {
    const regex = new RegExp(`<script[^>]*${script}[^>]*></script>`, "gi");
    html = html.replace(regex, "");
  });

  // 2. Rimuovi TUTTI gli script dal body tranne loader e tracking
  html = html.replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/gi, (match, src) => {
    if (scriptsToKeepInBody.some(s => src.includes(s))) {
      return match; // lo teniamo
    }
    return ""; // lo rimuoviamo
  });

  // 3. Inserisci SEO e structured-data nel <head>
  const seoBlock = `
    <script src="/seo.js"></script>
    <script src="/structured-data.js"></script>
  `;

  html = html.replace("</head>", `${seoBlock}\n</head>`);

  // 4. Salva il file
  fs.writeFileSync(filePath, html, "utf8");
  console.log("Patchato:", filePath);
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith(".html")) {
      processHTML(fullPath);
    }
  });
}

walk(targetDir);
console.log("Patch completato.");
