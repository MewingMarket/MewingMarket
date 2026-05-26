/**
 * =========================================================
 * SCANNER DATABASE.CJS — Versione 2058
 * Controlla se database.cjs viene richiamato correttamente
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "app/server");
const TARGET = path.join(ROOT, "db", "database.cjs");

console.log("📌 Scanner avviato");
console.log("Percorso reale database.cjs:", TARGET);
console.log("--------------------------------------------------\n");

/* =========================================================
   SCANSIONE RICORSIVA
========================================================= */
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const e of entries) {
    const full = path.join(dir, e.name);

    if (e.isDirectory()) {
      scanDir(full);
      continue;
    }

    if (!e.name.endsWith(".js") && !e.name.endsWith(".cjs")) continue;

    scanFile(full);
  }
}

/* =========================================================
   SCANSIONE FILE
========================================================= */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  const regex = /require\s*\(\s*["'`](.*?)["'`]\s*\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const rawPath = match[1];

    if (!rawPath.includes("database.cjs")) continue;

    const resolved = path.resolve(path.dirname(filePath), rawPath);

    console.log("📄 File:", filePath);
    console.log("   ➤ require:", rawPath);
    console.log("   ➤ risolto:", resolved);

    if (resolved === TARGET) {
      console.log("   ✅ OK — percorso corretto\n");
    } else {
      console.log("   ❌ ERRORE — percorso sbagliato!");
      console.log("      Percorso corretto:", TARGET, "\n");
    }
  }
}

/* =========================================================
   AVVIO SCANSIONE
========================================================= */
scanDir(ROOT);

console.log("--------------------------------------------------");
console.log("🟢 Scansione completata");
