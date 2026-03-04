/* =========================================================
   PATCH CLEAN FETCH — MewingMarket
   Rimuove TUTTI i vecchi fetch inline da tutte le pagine
   Versione definitiva CommonJS
========================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = "./app/public";

const skipFiles = [
  "header.html",
  "header-shop.html",
  "footer.html",
  "head.html"
];

// Regex che rimuove TUTTI i vecchi fetch inline
const patterns = [
  /<script>[\s\S]*?fetch\("header-shop\.html"[\s\S]*?<\/script>/gi,
  /<script>[\s\S]*?fetch\("footer\.html"[\s\S]*?<\/script>/gi,
  /<script>[\s\S]*?fetch\("head\.html"[\s\S]*?<\/script>/gi,
  /<script>[\s\S]*?\.then\(r => r\.text\(\)[\s\S]*?<\/script>/gi,
  /<!-- LOGICA HEADER SHOP -->/gi,
  /<!-- LOGICA FOOTER -->/gi,
  /<!-- AUTH GLOBALE -->/gi,
  /<!-- TRACKING UNIVERSALE -->/gi,
  /<!-- SEO DINAMICO -->/gi
];

function cleanFile(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  let original = html;

  patterns.forEach(regex => {
    html = html.replace(regex, "");
  });

  if (html !== original) {
    fs.writeFileSync(filePath, html, "utf8");
    console.log("Fetch rimossi:", filePath);
  }
}

function scan(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scan(fullPath);
      continue;
    }

    if (file.endsWith(".html") && !skipFiles.includes(file)) {
      cleanFile(fullPath);
    }
  }
}

scan(ROOT);
