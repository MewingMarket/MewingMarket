/* =========================================================
 * JS-LIST — Versione SAFE 2038 (cache + TTL + lock)
========================================================= */

const fs = require("fs");
const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

const ROOT = path.join(process.cwd(), "app/public");
const PUBLIC_ROOT = ROOT;
const ADMIN_ROOT = path.join(ROOT, "admin");

const PUBLIC_JSON = path.join(process.cwd(), "app/public/data/js-list.json");
const MIRROR_JSON = path.join(process.cwd(), "app/data/js-list-mirror.json");

const EXCLUDE = [
  "seo.js","structured-data.js","tracking.js","auth.js","header.js","carrello.js",
  "chat.js","premium.js",
  "loader-admin.js","dynamic-admin-loader.js","seo-admin.js","structured-data-admin.js",
  "loader-universale-2030.js","loader-universale-2038.js"
];

/* =========================================================
 * CACHE
========================================================= */
let cachedList = null;
let lastUpdate = 0;
let refreshing = false;
const TTL_MS = 60_000;

/* =========================================================
 * SCANSIONE
========================================================= */
function scanJS(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    return files
      .filter(f => f.endsWith(".js"))
      .filter(f => !EXCLUDE.includes(f))
      .sort();
  } catch {
    return [];
  }
}

/* =========================================================
 * SALVATAGGI
========================================================= */
function saveToDatabase(list) {
  try {
    db.prepare("DELETE FROM js_files").run();
    const insert = db.prepare("INSERT INTO js_files (filename, section) VALUES (?, ?)");
    list.public.forEach(js => insert.run(js, "public"));
    list.admin.forEach(js => insert.run(js, "admin"));
  } catch {}
}

function saveJSON(list) {
  try {
    fs.writeFileSync(PUBLIC_JSON, JSON.stringify(list, null, 2));
    fs.writeFileSync(MIRROR_JSON, JSON.stringify(list, null, 2));
  } catch {}
}

/* =========================================================
 * RIGENERAZIONE
========================================================= */
function regenerateList() {
  if (refreshing) return;

  refreshing = true;

  try {
    let publicJS = scanJS(PUBLIC_ROOT);
    let adminJS = scanJS(ADMIN_ROOT);

    const list = { public: publicJS, admin: adminJS };

    cachedList = list;
    lastUpdate = Date.now();

    saveToDatabase(list);
    saveJSON(list);

    console.log("🟩 [JS-LIST] Rigenerata e cache aggiornata");
  } catch (err) {
    console.error("❌ [JS-LIST] Errore rigenerazione:", err.message);
  } finally {
    refreshing = false;
  }
}

/* =========================================================
 * HANDLER DIRETTO
========================================================= */
module.exports = (req, res) => {
  const now = Date.now();

  if (cachedList && now - lastUpdate < TTL_MS) {
    return res.json(cachedList);
  }

  regenerateList();

  if (!cachedList) {
    return res.json({ public: [], admin: [] });
  }

  res.json(cachedList);
};
