/**
 * =========================================================
 * SCANNER DATABASE VARIANTS — Versione 2070 PRO
 * Rileva:
 * - db.cjs
 * - Db.cjs
 * - DB.cjs
 * - database.cjs
 * - Database.cjs
 * - dataBase.cjs
 * - database (senza estensione)
 * - db (senza estensione)
 * - file duplicati
 * - file corrotti
 * - require sbagliati
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(process.cwd(), "app/server");
const TARGET = path.join(ROOT, "db", "database.cjs");

console.log("📌 Scanner Variants avviato");
console.log("Percorso ufficiale database.cjs:", TARGET);
console.log("--------------------------------------------------\n");

/* =========================================================
   HASH DATABASE UFFICIALE
========================================================= */
function fileHash(file) {
  try {
    const data = fs.readFileSync(file);
    return crypto.createHash("sha256").update(data).digest("hex");
  } catch {
    return null;
  }
}

const TARGET_HASH = fileHash(TARGET);

/* =========================================================
   NOMI SOSPETTI
========================================================= */
const suspiciousNames = [
  "db.cjs",
  "Db.cjs",
  "DB.cjs",
  "database.cjs",
  "Database.cjs",
  "dataBase.cjs",
  "DATABASE.cjs",
  "db",
  "database"
];

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

    // Controlla se contiene un nome sospetto
    if (!suspiciousNames.some(n => rawPath.toLowerCase().includes(n.toLowerCase()))) {
      continue;
    }

    const resolved = path.resolve(path.dirname(filePath), rawPath);

    console.log("📄 File:", filePath);
    console.log("   ➤ require:", rawPath);
    console.log("   ➤ risolto:", resolved);

    /* =====================================================
       1) Controllo esistenza file
    ===================================================== */
    if (!fs.existsSync(resolved)) {
      console.log("   ❌ ERRORE — Il file NON esiste!");
      console.log("      Percorso corretto:", TARGET, "\n");
      continue;
    }

    /* =====================================================
       2) Controllo se è il database ufficiale
    ===================================================== */
    const h = fileHash(resolved);

    if (h !== TARGET_HASH) {
      console.log("   ❌ ERRORE — Questo NON è il database ufficiale!");
      console.log("      Hash ufficiale:", TARGET_HASH);
      console.log("      Hash trovato:  ", h);
      console.log("      Percorso corretto:", TARGET, "\n");
      continue;
    }

    /* =====================================================
       3) Tutto OK
    ===================================================== */
    console.log("   ✅ OK — percorso corretto e database autentico\n");
  }
}

/* =========================================================
   AVVIO SCANSIONE
========================================================= */
scanDir(ROOT);

console.log("--------------------------------------------------");
console.log("🟢 Scansione Variants completata");
