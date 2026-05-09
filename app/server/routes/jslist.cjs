/* =========================================================
 * JS-LIST — Versione SAFE 2040 (STATIC MAP DEFINITIVA)
 * Diviso in 2 liste: PUBLIC + ADMIN
========================================================= */

const fs = require("fs");
const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

const PUBLIC_JSON = path.join(process.cwd(), "app/public/data/js-list.json");
const MIRROR_JSON = path.join(process.cwd(), "app/data/js-list-mirror.json");

/* =========================================================
 * LISTA PUBLIC — SOLO JS DI PAGINA REALI (FRONTEND)
========================================================= */
function getPublicList() {
  return [
    "index.js",
    "catalogo.js",
    "prodotto.js",

    "login.js",
    "registrazione.js",
    "profilo.js",
    "ordini.js",
    "dashboard.js",
    "download.js",
    "recensioni.js",
    "thankyou.js",
    "cancel.js",

    // pagine informative reali
    "FAQ.js",
    "assistenza.js",
    "guide.js",
    "top-recensioni.js",
    "rimborso.js",
    "elimina-account.js",
    "disiscrizione.js",
    "iscrizione.js",
    "regole.js",
    "introspect.js"
  ];
}

/* =========================================================
 * LISTA ADMIN — SOLO JS DI PAGINA REALI (ADMIN)
========================================================= */
function getAdminList() {
  return [
    "admin-prodotti.js",
    "admin-prodotti-ai.js",
    "admin-confronto.js",
    "admin-utenti.js",

    "dashboard-admin-profilo.js",
    "dashboard-vendite-ordini.js",
    "validazione-prodotti.js",
    "feedback.js"
  ];
}

/* =========================================================
 * LISTA COMPLETA (PER /api/js-list)
========================================================= */
function getStaticList() {
  return {
    public: getPublicList(),
    admin: getAdminList()
  };
}

/* =========================================================
 * CACHE
========================================================= */
let cachedList = null;
let lastUpdate = 0;
let refreshing = false;
const TTL_MS = 60_000;

/* =========================================================
 * RIGENERAZIONE (USA LA LISTA STATICA)
========================================================= */
function regenerateList() {
  if (refreshing) return;
  refreshing = true;

  try {
    const list = getStaticList();

    cachedList = list;
    lastUpdate = Date.now();

    saveToDatabase(list);
    saveJSON(list);

    console.log("🟩 [JS-LIST] Rigenerata (STATIC MAP 2040) + cache aggiornata");
  } catch (err) {
    console.error("❌ [JS-LIST] Errore rigenerazione:", err.message);
  } finally {
    refreshing = false;
  }
}

/* =========================================================
 * SALVATAGGI (INVARIATI)
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
 * HANDLER DIRETTO (INVARIATO)
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

/* =========================================================
 * EXPORT FUNZIONI PER I LOADER UNIVERSALI
========================================================= */
module.exports.getPublicList = getPublicList;
module.exports.getAdminList = getAdminList;
