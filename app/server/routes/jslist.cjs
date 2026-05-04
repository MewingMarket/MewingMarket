// =========================================================
// ROUTER JS-LIST — Genera lista JS, salva nel DB e nei JSON
// =========================================================

const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();

// DB
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

// Cartelle JS
const PUBLIC_ROOT = path.join(process.cwd(), "app/public");
const ADMIN_ROOT = path.join(process.cwd(), "app/public/admin");

// Percorsi JSON statici
const PUBLIC_JSON = path.join(process.cwd(), "app/public/data/js-list.json");
const MIRROR_JSON = path.join(process.cwd(), "app/data/js-list-mirror.json");

// File da escludere
const GLOBAL_JS = [
  "seo.js",
  "structured-data.js",
  "tracking.js",
  "auth.js",
  "header.js",
  "carrello.js"
];

const SPECIAL_EXCLUDE = [
  "chat.js",
  "premium.js"
];

const ADMIN_CRITICAL_EXCLUDE = [
  "loader-admin.js",
  "dynamic-admin-loader.js",
  "seo-admin.js",
  "structured-data-admin.js"
];

const UNIVERSAL_EXCLUDE = [
  "loader-universale-2030.js",
  "loader-universale-2038.js"
];

const EXCLUDE = [
  ...GLOBAL_JS,
  ...SPECIAL_EXCLUDE,
  ...ADMIN_CRITICAL_EXCLUDE,
  ...UNIVERSAL_EXCLUDE
];

// =========================================================
// SCANSIONE CARTELLE
// =========================================================
function scanJS(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".js"))
    .filter(f => !EXCLUDE.includes(f))
    .sort();
}

// =========================================================
// SALVA NEL DATABASE
// =========================================================
function saveToDatabase(list) {
  try {
    db.prepare("DELETE FROM js_files").run();

    const insert = db.prepare(`
      INSERT INTO js_files (filename, section)
      VALUES (?, ?)
    `);

    list.public.forEach(js => insert.run(js, "public"));
    list.admin.forEach(js => insert.run(js, "admin"));

    console.log("🟩 [JS-LIST] Salvato nel database");
  } catch (err) {
    console.error("❌ Errore salvataggio DB:", err.message);
  }
}

// =========================================================
// SALVA JSON STATICI
// =========================================================
function saveJSON(list) {
  try {
    fs.writeFileSync(PUBLIC_JSON, JSON.stringify(list, null, 2));
    fs.writeFileSync(MIRROR_JSON, JSON.stringify(list, null, 2));
    console.log("🟩 [JS-LIST] JSON statici aggiornati");
  } catch (err) {
    console.error("❌ Errore salvataggio JSON:", err.message);
  }
}

// =========================================================
// ENDPOINT PRINCIPALE
// =========================================================
router.get("/js-list", (req, res) => {

  const publicJS = scanJS(PUBLIC_ROOT);
  const adminJS = scanJS(ADMIN_ROOT);

  const list = { public: publicJS, admin: adminJS };

  saveToDatabase(list);
  saveJSON(list);

  res.json(list);
});

module.exports = router;
