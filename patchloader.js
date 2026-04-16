#!/usr/bin/env node

/**
 * Patch SOLO gli HTML:
 * - sostituisce load-header-footer.js → loader.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("app/public");

console.log("🔧 Patch HTML sotto:", ROOT);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full); // ← NIENTE return
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      let html = fs.readFileSync(full, "utf8");

      if (html.includes("load-header-footer.js")) {
        console.log("   • Patch:", full);
        html = html.replace(/load-header-footer\.js/g, "loader.js");
        fs.writeFileSync(full, html, "utf8");
      }
    }
  }
}

walk(ROOT);

console.log("✅ Patch HTML completata.");
