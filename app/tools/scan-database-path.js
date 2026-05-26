/**
 * =========================================================
 * SCANNER ULTRA‑PRO — Find Files to Patch (Versione 2071)
 * Rileva:
 * - require("../db.cjs")
 * - require("./db.cjs")
 * - require("db")
 * - require("database")
 * - uso di db.query (MySQL)
 * - uso di NOW() (MySQL)
 * - moduli che NON usano database ufficiale
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "app");
const OFFICIAL_DB = path.join(process.cwd(), "app/server/db/database.cjs");

console.log("📌 Scanner ULTRA‑PRO avviato");
console.log("Database ufficiale:", OFFICIAL_DB);
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

  let flagged = false;

  /* =====================================================
     1) require sospetti
  ===================================================== */
  const badRequirePatterns = [
    "require(\"../db.cjs\")",
    "require('../db.cjs')",
    "require(\"./db.cjs\")",
    "require('./db.cjs')",
    "require(\"db.cjs\")",
    "require('db.cjs')",
    "require(\"db\")",
    "require('db')",
    "require(\"database\")",
    "require('database')"
  ];

  for (const p of badRequirePatterns) {
    if (content.includes(p)) {
      console.log("❌ FILE DA PATCHARE:", filePath);
      console.log("   ➤ Motivo: require sospetto →", p);
      flagged = true;
    }
  }

  /* =====================================================
     2) uso di MySQL (.query)
  ===================================================== */
  if (content.includes(".query(")) {
    if (!flagged) console.log("❌ FILE DA PATCHARE:", filePath);
    console.log("   ➤ Motivo: usa db.query (MySQL)");
    flagged = true;
  }

  /* =====================================================
     3) uso di NOW() (MySQL)
  ===================================================== */
  if (content.includes("NOW()")) {
    if (!flagged) console.log("❌ FILE DA PATCHARE:", filePath);
    console.log("   ➤ Motivo: usa NOW() (MySQL)");
    flagged = true;
  }

  /* =====================================================
     4) NON usa database ufficiale
  ===================================================== */
  if (!content.includes("app/server/db/database.cjs")) {
    // Se non è già stato segnalato e contiene SQL
    if (!flagged && content.match(/SELECT|INSERT|UPDATE|DELETE/i)) {
      console.log("⚠️  POSSIBILE FILE DA PATCHARE:", filePath);
      console.log("   ➤ Motivo: usa SQL ma NON importa database ufficiale");
    }
  }

  if (flagged) console.log("");
}

/* =========================================================
   AVVIO SCANSIONE
========================================================= */
scanDir(ROOT);

console.log("--------------------------------------------------");
console.log("🟢 Scansione ULTRA‑PRO completata");
