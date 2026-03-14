const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "app/public");

const pagesWithLoader = {};
const pagesWithoutLoader = [];

function scanHtml(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const matches = [...html.matchAll(/<script[^>]+src="([^"]*loader[^"]*)"/gi)];

  if (matches.length === 0) {
    pagesWithoutLoader.push(filePath.replace(ROOT, ""));
    return;
  }

  matches.forEach(m => {
    const src = m[1].trim();
    if (!pagesWithLoader[src]) pagesWithLoader[src] = [];
    pagesWithLoader[src].push(filePath.replace(ROOT, ""));
  });
}

function walk(dir) {
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
      continue;
    }

    if (name.endsWith(".html")) {
      scanHtml(full);
    }
  }
}

console.log("=== SCAN LOADER (solo differenze) ===");
walk(ROOT);

console.log("\n🔗 RICHIAMI TROVATI:");
for (const src in pagesWithLoader) {
  console.log(`\nsrc="${src}"`);
  pagesWithLoader[src].forEach(p => console.log("   →", p));
}

console.log("\n⚠️ PAGINE SENZA LOADER:");
if (pagesWithoutLoader.length === 0) {
  console.log("   Nessuna (perfetto)");
} else {
  pagesWithoutLoader.forEach(p => console.log("   →", p));
}

console.log("\n=== FINE ===");
