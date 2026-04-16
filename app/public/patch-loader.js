#!/usr/bin/env node

/**
 * Patch loader negli HTML
 * - Cerca load-header-footer.js
 * - Lo sostituisce con loader.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("app/public");

console.log("🔧 Patch loader negli HTML sotto:", ROOT);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
      return;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      const html = fs.readFileSync(full, "utf8");

      if (html.includes("load-header-footer.js")) {
        console.log("   • Patch:", full);
        const patched = html.replace(/load-header-footer\.js/g, "loader.js");
        fs.writeFileSync(full, patched, "utf8");
      }
    }
  }
}

// 1) Patch HTML
walk(ROOT);

// 2) Rinomina file JS se presente
const oldFile = path.join(ROOT, "load-header-footer.js");
const newFile = path.join(ROOT, "loader.js");

if (fs.existsSync(oldFile)) {
  console.log("➡️  Rinomino load-header-footer.js → loader.js");
  fs.renameSync(oldFile, newFile);
} else {
  console.log("⚠️  load-header-footer.js non trovato (ok se già rinominato)");
}

console.log("✅ Patch completata.");
