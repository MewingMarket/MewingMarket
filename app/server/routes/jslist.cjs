// =========================================================
// ROUTER JS-LIST — Versione SAFE 2038
// Filesystem → DB → JSON → Loader Universale
// =========================================================

const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();

// DB
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

// Path sicuri (Render + locale)
const ROOT = path.join(__dirname, "../../public");
const PUBLIC_ROOT = ROOT;
const ADMIN_ROOT = path.join(ROOT, "admin");

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
// SCANSIONE CARTELLE (SAFE)
// =========================================================
function scanJS(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    if (!Array.isArray(files)) return [];

    return files
      .filter(f => f.endsWith(".js"))
      .filter(f => !EXCLUDE.includes(f))
      .sort();

  } catch (err) {
    console.error("❌ scanJS error:", err.message);
    return [];
  }
}

// =========================================================
// SALVA NEL DATABASE (SAFE)
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
// SALVA JSON STATICI (SAFE)
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
// ENDPOINT PRINCIPALE (SAFE)
// =========================================================
router.get("/js-list", (req, res) => {

  let publicJS = scanJS(PUBLIC_ROOT);
  let adminJS = scanJS(ADMIN_ROOT);

  // Fallback anti-crash
  if (!Array.isArray(publicJS)) publicJS = [];
  if (!Array.isArray(adminJS)) adminJS = [];

  const list = { public: publicJS, admin: adminJS };

  saveToDatabase(list);
  saveJSON(list);

  res.json(list);
});

module.exports = router;
