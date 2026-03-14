// scanner-loader.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "app", "public");

function scanHtmlForLoaderScripts(filePath, html, refsBySrc) {
  const re = /<script[^>]+src="([^"]*loader[^"]*)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const src = m[1].trim();
    if (!refsBySrc[src]) refsBySrc[src] = [];
    refsBySrc[src].push(filePath.replace(ROOT, "") || "/");
  }
}

function scanDir(dir, loaderFiles, refsBySrc) {
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      scanDir(full, loaderFiles, refsBySrc);
      continue;
    }

    const rel = full.replace(ROOT, "") || "/";

    // JS che contengono "loader" nel nome
    if (name.toLowerCase().includes("loader") && name.endsWith(".js")) {
      loaderFiles.add(rel);
    }

    // HTML che richiamano script con "loader" nel src
    if (name.endsWith(".html")) {
      const html = fs.readFileSync(full, "utf8");
      scanHtmlForLoaderScripts(rel, html, refsBySrc);
    }
  }
}

console.log("=== SCAN LOADER (app/public) ===");

const loaderFiles = new Set();
const refsBySrc = {};

scanDir(ROOT, loaderFiles, refsBySrc);

console.log("\n📂 FILE JS CON 'loader' NEL NOME:");
if (loaderFiles.size === 0) {
  console.log("   (nessuno trovato)");
} else {
  for (const f of loaderFiles) console.log("   •", f);
}

console.log("\n🔗 RICHIAMI <script> CON 'loader' NEL src:");
const srcKeys = Object.keys(refsBySrc);
if (srcKeys.length === 0) {
  console.log("   (nessun richiamo trovato)");
} else {
  for (const src of srcKeys) {
    console.log(`\n   src="${src}"`);
    refsBySrc[src].forEach(p => console.log("      →", p));
  }
}

console.log("\n=== FINE SCAN LOADER ===");
