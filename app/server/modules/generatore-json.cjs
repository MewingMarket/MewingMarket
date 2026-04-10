/* =========================================================
 * GENERATORE JSON — Mirror automatico del database SQL
 * Auto-detect tabelle da schema SQL
 * Persistente su /var/data/json + copia in /app/public/data
 * PATCH 2026 — Export schema + backup log + newsletter novità
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

// ---------------------------------------------------------
// Percorsi
// ---------------------------------------------------------

const DISK_DIR = "/var/data/json";
const PUBLIC_DIR = path.join(process.cwd(), "app/public/data");
const LAST_NOVITA_FILE = path.join(DISK_DIR, "last-novita.json");

[DISK_DIR, PUBLIC_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("📁 Creata cartella:", dir);
  }
});

// ---------------------------------------------------------
// Helper: salva JSON in persistente + copia nel public
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 1) AUTO-DETECT TABELLE DAL DATABASE
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 2) ESPORTA OGNI TABELLA IN JSON
// ---------------------------------------------------------
async function exportTable(table) {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY 1 DESC`).all();
    saveJSON(`${table}.json`, rows);
    console.log(`📄 Tabella esportata: ${table}`);
  } catch (err) {
    console.error(`❌ Errore exportTable (${table}):`, err.message);
  }
}

// ---------------------------------------------------------
// 3) PATCH — Invio automatico newsletter “Novità”
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 4) EXPORT SPECIALI (prodotti, categorie, youtube, catalogo)
// ---------------------------------------------------------
async function exportSpecial() {
  try {
    const prodotti = await catalogo.getAllProducts();
    const categorie = await catalogo.getAllCategories();

    saveJSON("products.json", prodotti);
    saveJSON("categories.json", categorie);

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

    saveJSON("catalog.json", {
      prodotti,
      categorie,
      youtube
    });

    await checkAndSendNovita();

    console.log("📚 Export special completato");
  } catch (err) {
    console.error("❌ Errore exportSpecial:", err.message);
  }
}

// ---------------------------------------------------------
// 5) EXPORT BACKUP LOG (mirror JSON)
// ---------------------------------------------------------
async function exportBackupLog() {
  try {
    const rows = db.prepare(`
      SELECT id, created_at, source, hash, size_bytes, filename
      FROM backups_log
      ORDER BY id DESC
    `).all();

    saveJSON("backups.json", rows);
    console.log("🗂️ Backup log esportato");
  } catch (err) {
    console.error("❌ Errore exportBackupLog:", err.message);
  }
}

// ---------------------------------------------------------
// 6) EXPORT SCHEMA — colonne, tipi, PK, FK, indici
// ---------------------------------------------------------
async function exportSchema() {
  try {
    const tables = db.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `).all();

    const schema = {};

    for (const t of tables) {
      const table = t.name;

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
        foreignKeys: foreignKeys.map(fk => ({
          id: fk.id,
          table: fk.table,
          from: fk.from,
          to: fk.to,
          onUpdate: fk.on_update,
          onDelete: fk.on_delete
        })),
        indexes: indexes.map(idx => ({
          name: idx.name,
          unique: Boolean(idx.unique),
          origin: idx.origin,
          partial: Boolean(idx.partial)
        }))
      };
    }

    saveJSON("schema.json", schema);
    console.log("📐 Schema SQL esportato");

  } catch (err) {
    console.error("❌ Errore exportSchema:", err.message);
  }
}

// ---------------------------------------------------------
// 7) EXPORT COMPLETO
// ---------------------------------------------------------
async function exportAll() {
  console.log("⏳ Rigenerazione JSON…");

  const tables = getAllTables();

  for (const t of tables) {
    await exportTable(t);
  }

  await exportSpecial();
  await exportBackupLog();
  await exportSchema();

  console.log("✅ Tutti i JSON rigenerati (persistente + public)");
}

module.exports = {
  exportAll
};
