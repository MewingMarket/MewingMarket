const fs = require("fs");
const path = require("path");

const root = process.cwd();
const publicDir = path.join(root, "app", "public");
const pagesDir = path.join(root, "pages");

// 🔥 1. Elimina completamente /pages
if (fs.existsSync(pagesDir)) {
  fs.rmSync(pagesDir, { recursive: true, force: true });
  console.log("🗑️  Rimossa cartella /pages");
}

// 🔥 2. Ricrea /pages
fs.mkdirSync(pagesDir, { recursive: true });
console.log("📁 Creata nuova cartella /pages");

// 🔥 3. Copia ricorsiva public → pages
function copyRecursive(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
      console.log(`✔ Copiato: ${src} → ${dest}`);
    }
  }
}

copyRecursive(publicDir, pagesDir);

console.log("\n🎉 Build completata! /pages ora è IDENTICO a /app/public\n");
