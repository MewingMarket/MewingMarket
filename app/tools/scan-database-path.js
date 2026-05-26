/**
 * =========================================================
 * SCANNER GIUDICE — Versione 2072
 * Classifica i file in:
 * - CONDANNATI (errore certo)
 * - SOSPETTI (da verificare)
 * - INNOCENTI (da ignorare)
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "app");
const OFFICIAL_DB = "app/server/db/database.cjs";

console.log("⚖️  Scanner GIUDICE avviato\n");

/* =========================================================
   UTILS
========================================================= */
function isFrontend(file) {
  return file.includes("/public/");
}

function isServer(file) {
  return file.includes("/server/");
}

function isModule(file) {
  return file.includes("/modules/");
}

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

  let condannato = false;
  let sospetto = false;

  /* =====================================================
     1) ERRORI CERTI → CONDANNATI
  ===================================================== */
  if (content.includes("require(\"../db.cjs\")") ||
      content.includes("require('../db.cjs')") ||
      content.includes("require(\"./db.cjs\")") ||
      content.includes("require('./db.cjs')")) {
    condannato = true;
    console.log("❌ CONDANNATO:", filePath);
    console.log("   ➤ Motivo: usa db.cjs (database sbagliato)\n");
    return;
  }

  if (content.includes(".query(")) {
    condannato = true;
    console.log("❌ CONDANNATO:", filePath);
    console.log("   ➤ Motivo: usa db.query (MySQL)\n");
    return;
  }

  if (content.includes("NOW()")) {
    condannato = true;
    console.log("❌ CONDANNATO:", filePath);
    console.log("   ➤ Motivo: usa NOW() (MySQL)\n");
    return;
  }

  /* =====================================================
     2) SOSPETTI → solo se lato server
  ===================================================== */
  if (isServer(filePath) || isModule(filePath)) {
    if (content.match(/SELECT|INSERT|UPDATE|DELETE/i) &&
        !content.includes(OFFICIAL_DB)) {
      sospetto = true;
      console.log("⚠️  SOSPETTO:", filePath);
      console.log("   ➤ Motivo: SQL lato server ma NON importa database ufficiale\n");
      return;
    }
  }

  /* =====================================================
     3) INNOCENTI → ignorati
  ===================================================== */
  // Non stampiamo nulla per evitare rumore
}

/* =========================================================
   AVVIO SCANSIONE
========================================================= */
scanDir(ROOT);

console.log("--------------------------------------------------");
console.log("🟢 Scansione GIUDICE completata");
