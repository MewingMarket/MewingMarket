// scannercss-title.js
// node scannercss-title.js

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function walk(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.isFile()) acc.push(full);
  }
  return acc;
}

function isHtml(file) {
  return file.endsWith(".html");
}

function isJs(file) {
  return file.endsWith(".js");
}

function makeTitleFromFilename(file) {
  const base = path.basename(file, ".html");
  if (base === "index") return "MewingMarket – Prodotti digitali";
  const pretty = base
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
  return `${pretty} | MewingMarket`;
}

function patchHtml(file) {
  let src = fs.readFileSync(file, "utf8");

  const hasDynamicTitle =
    src.includes('id="dynamic-title"') || src.includes("dynamic-title");

  const hasStaticTitle = /<title[^>]*>[\s\S]*?<\/title>/i.test(src);

  const cssLinks = [...src.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)].map(
    m => m[0]
  );

  console.log(`\n[HTML] ${path.relative(ROOT, file)}`);
  console.log("  - static title:", hasStaticTitle);
  console.log("  - dynamic title:", hasDynamicTitle);
  console.log("  - css links:", cssLinks.length);

  // 1) rimuovi TUTTI i <link rel="stylesheet">
  src = src.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>\s*/gi, "");

  // 2) rimuovi TUTTI i <title ...>...</title>
  src = src.replace(/<title[^>]*>[\s\S]*?<\/title>\s*/gi, "");

  // 3) rimuovi id dinamici noti
  src = src
    .replace(/id=["']dynamic-title["']/gi, "")
    .replace(/id=["']dynamic-description["']/gi, "")
    .replace(/id=["']dynamic-canonical["']/gi, "")
    .replace(/id=["']og-title["']/gi, "")
    .replace(/id=["']og-description["']/gi, "")
    .replace(/id=["']og-url["']/gi, "")
    .replace(/id=["']og-image["']/gi, "")
    .replace(/id=["']twitter-title["']/gi, "")
    .replace(/id=["']twitter-description["']/gi, "")
    .replace(/id=["']twitter-image["']/gi, "");

  // 4) inserisci un <title> statico nel <head>
  const title = makeTitleFromFilename(file);
  if (src.includes("<head")) {
    src = src.replace(
      /<head([^>]*)>/i,
      `<head$1>\n  <title>${title}</title>`
    );
  }

  fs.writeFileSync(file, src, "utf8");
}

function scanJs(file) {
  const src = fs.readFileSync(file, "utf8");
  const hasDocTitle = src.includes("document.title");
  const hasDynamicId = src.includes("dynamic-title");
  if (hasDocTitle || hasDynamicId) {
    console.log(`\n[JS] ${path.relative(ROOT, file)}`);
    console.log("  - document.title:", hasDocTitle);
    console.log("  - dynamic-title ref:", hasDynamicId);
  }
}

function main() {
  const files = walk(ROOT);

  console.log("🔍 Scanner + Patcher TITLE/CSS\n");

  files.filter(isHtml).forEach(patchHtml);
  files.filter(isJs).forEach(scanJs);

  console.log("\n✅ Completato.");
}

main();
