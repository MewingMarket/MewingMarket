/* =========================================================
 * GENERATORE JSON — Mirror automatico del database SQL
 * Versione FIX 2027.901 — NIENTE /var (compatibile ovunque)
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

// DB + Catalogo
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo-sql.cjs"));

// Newsletter Novità
const axios = require("axios");
const { inviaEmailNovita } = require(path.join(process.cwd(), "app/server/modules/email-novita.cjs"));
const { LISTA_NEWSLETTER } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));

/* =========================================================
   ⭐ PATCH PERCORSI — niente /var/data/json
   Tutto dentro il progetto → nessun EACCES
========================================================= */

const DISK_DIR = path.join(process.cwd(), "data/json");
const PUBLIC_DIR = path.join(process.cwd(), "app/public/data");
const LAST_NOVITA_FILE = path.join(DISK_DIR, "last-novita.json");

// Crea cartelle interne al progetto
[DISK_DIR, PUBLIC_DIR].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log("📁 Creata cartella:", dir);
    }
  } catch (err) {
    console.error("❌ ERRORE CREAZIONE CARTELLA:", dir, err.message);
  }
});

/* =========================================================
   Helper: salva JSON in persistente + copia nel public
========================================================= */
function saveJSON(filename, data) {
  try {
    const json = JSON.stringify(data, null, 2);

    fs.writeFileSync(path.join(DISK_DIR, filename), json, "utf8");
    fs.writeFileSync(path.join(PUBLIC_DIR, filename), json, "utf8");

    console.log(`💾 JSON aggiornato: ${filename}`);
  } catch (err) {
    console.error(`❌ ERRORE CRITICO salvataggio JSON (${filename}):`, err.message);
  }
}

/* =========================================================
   1) AUTO-DETECT TABELLE DAL DATABASE
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
   2) ESPORTA OGNI TABELLA IN JSON
========================================================= */
async function exportTable(table) {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY 1 DESC`).all();
    saveJSON(`${table}.json`, rows);
    console.log(`📄 Tabella esportata: ${table}`);
  } catch (err) {
    console.error(`❌ Errore exportTable (${table}):`, err.message);
  }
}

/* =========================================================
   3) PATCH — Invio automatico newsletter “Novità”
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
        headers: { "api-key": process.env.BREVO_API_KEY }
      }
    );

    const contacts = result.data?.contacts || [];
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
    console.error("❌ Errore invio automatico Novità:", err);
  }
}

/* =========================================================
   4) EXPORT SPECIALI
========================================================= */
async function exportProducts() {
  try {
    const prodotti = await catalogo.getAllProducts();
    saveJSON("products.json", prodotti);
    await checkAndSendNovita();
  } catch (err) {
    console.error("❌ Errore exportProducts:", err.message);
  }
}

async function exportCategories() {
  try {
    const categorie = await catalogo.getAllCategories();
    saveJSON("categories.json", categorie);
  } catch (err) {
    console.error("❌ Errore exportCategories:", err.message);
  }
}

async function exportYouTube() {
  try {
    const prodotti = await catalogo.getAllProducts();

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

    saveJSON("youtube.json", youtube);
  } catch (err) {
    console.error("❌ Errore exportYouTube:", err.message);
  }
}

async function exportCatalog() {
  try {
    const prodotti = await catalogo.getAllProducts();
    const categorie = await catalogo.getAllCategories();

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
   5–14) EXPORT LEGACY + KPI + BACKUP + SCHEMA
========================================================= */

async function exportUsers() {
  try {
    const rows = db.prepare(`
      SELECT id, email, created_at 
      FROM utenti 
      ORDER BY id DESC
    `).all();

    saveJSON("users.json", rows);
    console.log("👤 Users esportati");
  } catch (err) {
    console.error("❌ Errore exportUsers:", err.message);
  }
}

async function exportOrders() {
  try {
    const rows = db.prepare(`SELECT * FROM ordini ORDER BY id DESC`).all();
    saveJSON("orders.json", rows);
  } catch (err) {
    console.error("❌ Errore exportOrders:", err.message);
  }
}

async function exportSales() {
  try {
    const rows = db.prepare(`SELECT * FROM vendite ORDER BY id DESC`).all();
    saveJSON("sales.json", rows);
  } catch (err) {
    console.error("❌ Errore exportSales:", err.message);
  }
}

async function exportFeedback() {
  try {
    const rows = db.prepare(`SELECT * FROM feedback ORDER BY id DESC`).all();
    saveJSON("feedback.json", rows);
  } catch (err) {
    console.error("❌ Errore exportFeedback:", err.message);
  }
}

async function exportNewsletterLog() {
  try {
    const rows = db.prepare(`SELECT * FROM newsletter_log ORDER BY id DESC`).all();
    saveJSON("newsletter.json", rows);
  } catch (err) {
    console.error("❌ Errore exportNewsletterLog:", err.message);
  }
}

async function exportUserEvents() {
  try {
    const rows = db.prepare(`SELECT * FROM utenti_eventi ORDER BY id DESC`).all();
    saveJSON("user-events.json", rows);
  } catch (err) {
    console.error("❌ Errore exportUserEvents:", err.message);
  }
}

async function exportKpiGiornalieri() {
  try {
    const rows = db.prepare(`SELECT * FROM kpi_giornalieri ORDER BY data DESC`).all();
    saveJSON("kpi-daily.json", rows);
  } catch (err) {
    console.error("❌ Errore exportKpiGiornalieri:", err.message);
  }
}

async function exportKpiSettimanali() {
  try {
    const rows = db.prepare(`SELECT * FROM kpi_settimanali ORDER BY settimana DESC`).all();
    saveJSON("kpi-weekly.json", rows);
  } catch (err) {
    console.error("❌ Errore exportKpiSettimanali:", err.message);
  }
}

async function exportKpiMensili() {
  try {
    const rows = db.prepare(`SELECT * FROM kpi_mensili ORDER BY mese DESC`).all();
    saveJSON("kpi-monthly.json", rows);
  } catch (err) {
    console.error("❌ Errore exportKpiMensili:", err.message);
  }
}

async function exportBackupLog() {
  try {
    const rows = db.prepare(`
      SELECT id, created_at, source, hash, size_bytes, filename
      FROM backups_log
      ORDER BY id DESC
    `).all();

    saveJSON("backups.json", rows);
  } catch (err) {
    console.error("❌ Errore exportBackupLog:", err.message);
  }
}

async function exportSchema() {
  try {
    const tables = getAllTables();
    const schema = {};

    for (const table of tables) {
      const columns = db.prepare(`PRAGMA table_info(${table});`).all();
      const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table});`).all();
      const indexes = db.prepare(`PRAGMA index_list(${table});`).all();

      schema[table] = {
        columns: columns.map(c => ({
          name: c.name,
          type: c.type,
          notNull: Boolean(c.notnull),
          default: c.dflt_value,
          primaryKey: Boolean(c.pk)
        })),
        foreignKeys,
        indexes
      };
    }

    saveJSON("schema.json", schema);
  } catch (err) {
    console.error("❌ Errore exportSchema:", err.message);
  }
}

/* =========================================================
   EXPORT COMPLETO
========================================================= */
async function exportAll() {
  console.log("⏳ Rigenerazione JSON…");

  const tables = getAllTables();

  for (const t of tables) {
    await exportTable(t);
  }

  await exportProducts();
  await exportCategories();
  await exportYouTube();
  await exportCatalog();

  await exportUsers();
  await exportOrders();
  await exportSales();
  await exportFeedback();
  await exportNewsletterLog();
  await exportUserEvents();

  await exportKpiGiornalieri();
  await exportKpiSettimanali();
  await exportKpiMensili();

  await exportBackupLog();
  await exportSchema();

  console.log("✅ Tutti i JSON rigenerati (persistente + public)");
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
  exportUsers,
  exportOrders,
  exportSales,
  exportFeedback,
  exportNewsletterLog,
  exportUserEvents,
  exportKpiGiornalieri,
  exportKpiSettimanali,
  exportKpiMensili,
  exportBackupLog,
  exportSchema
};
