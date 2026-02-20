import fs from "fs";
import path from "path";

const root = process.cwd();
const publicDir = path.join(root, "app", "public");
const pagesDir = path.join(root, "pages");

// Assicura che /pages esista
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
  console.log("📁 Creata cartella /pages");
}

// Leggi TUTTI i file in /app/public
const files = fs.readdirSync(publicDir, { withFileTypes: true });

function copyRecursive(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest);
      copyRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
      console.log(`✔ Copiato: ${src} → ${dest}`);
    }
  }
}

// Copia TUTTO public → pages
copyRecursive(publicDir, pagesDir);

console.log("\n🎉 Build completata! /pages è sincronizzata con /app/public\n");
