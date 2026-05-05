/* =========================================================
 * GENERATORE JSON — SAFE MODE HARD (2038.300)
 * Mirror automatico del database SQL
 * Protezioni anti-OOM, anti-loop, anti-file enormi
 * Compatibile con router jslist.cjs + pipeline AI
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// DB + Catalogo
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo-sql.cjs"));

// Newsletter Novità
const axios = require("axios");
const { inviaEmailNovita } = require(path.join(process.cwd(), "app/server/modules/email-novita.cjs"));
const { LISTA_NEWSLETTER } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));

/* =========================================================
   LIMITI DI SICUREZZA
========================================================= */
const MAX_JSON_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 5000;
const MAX_NEWSLETTER = 200;
const TIMEOUT_MS = 8000;

/* =========================================================
   PERCORSI
========================================================= */
const DISK_DIR = path.join(process.cwd(), "data/json");
const PUBLIC_DIR = path.join(process.cwd(), "app/public/data");
const APPDATA_DIR = path.join(process.cwd(), "app/data");
const LAST_NOVITA_FILE = path.join(DISK_DIR, "last-novita.json");

[DISK_DIR, PUBLIC_DIR, APPDATA_DIR].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.error("❌ ERRORE CREAZIONE CARTELLA:", dir, err.message);
  }
});

/* =========================================================
   MIRROR SICURO
========================================================= */
function mirrorToAppData(filename) {
  try {
    const src = path.join(DISK_DIR, filename);
    const dest = path.join(APPDATA_DIR, filename);

    if (fs.existsSync(src)) {
      const stat = fs.statSync(src);
      if (stat.size > MAX_JSON_SIZE) {
        console.error(`❌ [MIRROR] ${filename} troppo grande (${stat.size} bytes). Skip.`);
        return;
      }

      fs.copyFileSync(src, dest);
      console.log(`🟩 [MIRROR] Copiato in app/data → ${filename}`);
    }
  } catch (err) {
    console.error(`❌ Errore mirrorToAppData (${filename}):`, err.message);
  }
}

/* =========================================================
   SALVATAGGIO JSON SICURO
========================================================= */
function saveJSON(filename, data) {
  try {
    const json = JSON.stringify(data, null, 2);

    if (json.length > MAX_JSON_SIZE) {
      console.error(`❌ JSON ${filename} troppo grande (${json.length} bytes). Skip.`);
      return;
    }

    fs.writeFileSync(path.join(DISK_DIR, filename), json, "utf8");
    fs.writeFileSync(path.join(PUBLIC_DIR, filename), json, "utf8");

    mirrorToAppData(filename);

    console.log(`💾 JSON aggiornato: ${filename}`);

  } catch (err) {
    console.error(`❌ ERRORE CRITICO salvataggio JSON (${filename}):`, err.message);
  }
}

/* =========================================================
   AUTO-DETECT TABELLE
========================================================= */
function getAllTables() {
  try {
    const rows = db.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `).all();

    return rows.map(r => r.name);
  } catch (err) {
    console.error("❌ Errore lettura lista tabelle:", err.message);
    return [];
  }
}

/* =========================================================
   EXPORT TABELLA (SAFE)
========================================================= */
async function exportTable(table) {
  try {
    let rows = db.prepare(`SELECT * FROM ${table} ORDER BY 1 DESC`).all();

    if (rows.length > MAX_ROWS) {
      console.error(`❌ [JSON] ${table} ha troppe righe (${rows.length}). Limitato a ${MAX_ROWS}.`);
      rows = rows.slice(0, MAX_ROWS);
    }

    saveJSON(`${table}.json`, rows);

    console.log(`🟩 [JSON] Tabella "${table}" esportata (${rows.length} righe)`);

  } catch (err) {
    console.error(`❌ Errore exportTable (${table}):`, err.message);
  }
}

/* =========================================================
   NEWSLETTER NOVITÀ (SAFE)
========================================================= */
async function checkAndSendNovita() {
  try {
    const latest = db.prepare(`
      SELECT * FROM prodotti ORDER BY id DESC LIMIT 1
    `).get();

    if (!latest) return;

    let lastSentId = 0;
    if (fs.existsSync(LAST_NOVITA_FILE)) {
      const data = JSON.parse(fs.readFileSync(LAST_NOVITA_FILE, "utf8"));
      lastSentId = data?.lastId || 0;
    }

    if (latest.id === lastSentId) {
      console.log("📭 Nessuna nuova novità da inviare");
      return;
    }

    console.log("🔥 Nuovo prodotto rilevato → invio newsletter Novità");

    const result = await axios.get(
      `https://api.brevo.com/v3/contacts/lists/${LISTA_NEWSLETTER}/contacts`,
      {
        headers: { "api-key": process.env.BREVO_API_KEY },
        timeout: TIMEOUT_MS
      }
    );

    const contacts = (result.data?.contacts || []).slice(0, MAX_NEWSLETTER);

    let count = 0;

    for (const c of contacts) {
      const email = String(c.email || "").trim().toLowerCase();
      if (!email) continue;

      await inviaEmailNovita({ email });
      count++;
    }

    console.log(`📨 Newsletter Novità inviata a ${count} iscritti`);

    fs.writeFileSync(
      LAST_NOVITA_FILE,
      JSON.stringify({ lastId: latest.id }, null, 2),
      "utf8"
    );

  } catch (err) {
    console.error("❌ Errore invio automatico Novità:", err.message);
  }
}

/* =========================================================
   EXPORT SPECIALI (SAFE)
========================================================= */
async function exportProducts() {
  try {
    const prodotti = await catalogo.getAllProducts();
    saveJSON("products.json", prodotti.slice(0, MAX_ROWS));
    await checkAndSendNovita();
  } catch (err) {
    console.error("❌ Errore exportProducts:", err.message);
  }
}

async function exportCategories() {
  try {
    const categorie = await catalogo.getAllCategories();
    saveJSON("categories.json", categorie.slice(0, MAX_ROWS));
  } catch (err) {
    console.error("❌ Errore exportCategories:", err.message);
  }
}

async function exportYouTube() {
  try {
    const prodotti = await catalogo.getAllProducts();

    const youtube = prodotti
      .filter(p => p.youtube_video_id)
      .slice(0, MAX_ROWS)
      .map(p => ({
        id: p.id,
        video_id: p.youtube_video_id,
        url: p.youtube_url,
        title: p.youtube_title,
        description: p.youtube_description,
        thumbnail: p.youtube_thumbnail
      }));

    saveJSON("youtube.json", youtube);
  } catch (err) {
    console.error("❌ Errore exportYouTube:", err.message);
  }
}

async function exportCatalog() {
  try {
    const prodotti = (await catalogo.getAllProducts()).slice(0, MAX_ROWS);
    const categorie = (await catalogo.getAllCategories()).slice(0, MAX_ROWS);

    const youtube = prodotti
      .filter(p => p.youtube_video_id)
      .map(p => ({
        id: p.id,
        video_id: p.youtube_video_id,
        url: p.youtube_url,
        title: p.youtube_title,
        description: p.youtube_description,
        thumbnail: p.youtube_thumbnail
      }));

    saveJSON("catalog.json", { prodotti, categorie, youtube });
  } catch (err) {
    console.error("❌ Errore exportCatalog:", err.message);
  }
}

/* =========================================================
   EXPORT VALIDAZIONI (SAFE)
========================================================= */
async function exportValidazioni() {
  try {
    const rows = db.prepare(`
      SELECT *
      FROM validazioni
      ORDER BY id DESC
      LIMIT ?
    `).all(MAX_ROWS);

    saveJSON("validazioni.json", rows);
  } catch (err) {
    console.error("❌ Errore exportValidazioni:", err.message);
  }
}

/* =========================================================
   EXPORT PRODOTTI_DA_CREARE (SAFE)
========================================================= */
async function exportProdottiDaCreare() {
  try {
    const rows = db.prepare(`
      SELECT *
      FROM prodotti_da_creare
      ORDER BY id DESC
      LIMIT ?
    `).all(MAX_ROWS);

    saveJSON("prodotti-da-creare.json", rows);
  } catch (err) {
    console.error("❌ Errore exportProdottiDaCreare:", err.message);
  }
}

/* =========================================================
   EXPORT LISTA JS (SAFE)
========================================================= */
async function exportJSList() {
  try {
    const rows = db.prepare(`
      SELECT filename, section
      FROM js_files
      ORDER BY filename ASC
    `).all();

    const publicJS = rows.filter(r => r.section === "public").map(r => r.filename);
    const adminJS  = rows.filter(r => r.section === "admin").map(r => r.filename);

    const data = { public: publicJS, admin: adminJS };

    saveJSON("js-list.json", data);

    console.log(`🟦 [JSON] js-list.json generato da database (${publicJS.length} public, ${adminJS.length} admin)`);

  } catch (err) {
    console.error("❌ Errore exportJSList:", err.message);
  }
}

/* =========================================================
   EXPORT COMPLETO (SAFE)
========================================================= */
async function exportAll() {
  console.log("⏳ Rigenerazione JSON (SAFE)…");

  const tables = getAllTables();

  for (const t of tables) {
    await exportTable(t);
  }

  await exportProducts();
  await exportCategories();
  await exportYouTube();
  await exportCatalog();
  await exportJSList();

  // opzionali
  await exportValidazioni();
  await exportProdottiDaCreare();

  console.log("✅ Tutti i JSON rigenerati (SAFE)");
}

/* =========================================================
   EXPORT API
========================================================= */
module.exports = {
  exportAll,
  exportProducts,
  exportCategories,
  exportYouTube,
  exportCatalog,
  exportValidazioni,
  exportProdottiDaCreare
};
