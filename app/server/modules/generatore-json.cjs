/**
 * =========================================================
 * GENERATORE JSON — Mirror del database SQL
 * Persistente su /var/data/json + copia in /app/public/data
 * PATCH 2026 — Invio automatico newsletter “Novità”
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

// Catalogo SQL
const catalogo = require("../../modules/catalogo-sql.cjs");
const db = require("../db/database.cjs");

// PATCH — moduli newsletter
const axios = require("axios");
const { inviaEmailNovita } = require("../modules/email-novita.cjs");
const { LISTA_NEWSLETTER } = require("../modules/liste-brevo.cjs");

// ---------------------------------------------------------
// Percorsi
// ---------------------------------------------------------

// 1) Persistente (Render Disk)
const DISK_DIR = "/var/data/json";

// 2) Copia per il frontend (volatile)
const PUBLIC_DIR = path.join(__dirname, "../../public/data");

// PATCH — file persistente per tracciare ultimo prodotto inviato
const LAST_NOVITA_FILE = path.join(DISK_DIR, "last-novita.json");

// Crea entrambe le cartelle se mancano
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

    // Persistente
    fs.writeFileSync(path.join(DISK_DIR, filename), json, "utf8");

    // Copia volatile per il frontend
    fs.writeFileSync(path.join(PUBLIC_DIR, filename), json, "utf8");

    console.log(`💾 JSON aggiornato: ${filename}`);
  } catch (err) {
    console.error(`❌ ERRORE CRITICO salvataggio JSON (${filename}):`, err.message);
  }
}

// ---------------------------------------------------------
// PATCH — Invio automatico newsletter “Novità”
// ---------------------------------------------------------
async function checkAndSendNovita() {
  try {
    // 1) Ultimo prodotto dal DB
    const latest = db.prepare(`
      SELECT * FROM prodotti ORDER BY id DESC LIMIT 1
    `).get();

    if (!latest) return;

    // 2) Ultimo prodotto già inviato
    let lastSentId = 0;
    if (fs.existsSync(LAST_NOVITA_FILE)) {
      const data = JSON.parse(fs.readFileSync(LAST_NOVITA_FILE, "utf8"));
      lastSentId = data?.lastId || 0;
    }

    // 3) Nessuna novità → stop
    if (latest.id === lastSentId) {
      console.log("📭 Nessuna nuova novità da inviare");
      return;
    }

    console.log("🔥 Nuovo prodotto rilevato → invio newsletter Novità");

    // 4) Recupera iscritti lista 8 da Brevo
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

    // 5) Aggiorna file persistente
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
// 1) Prodotti
// ---------------------------------------------------------
async function exportProducts() {
  try {
    const prodotti = await catalogo.getAllProducts();
    saveJSON("products.json", prodotti);
    console.log("✅ Prodotti esportati");

    // PATCH — dopo export → controlla se c'è un nuovo prodotto
    await checkAndSendNovita();

  } catch (err) {
    console.error("❌ Errore exportProducts:", err.message);
  }
}

// ---------------------------------------------------------
// 2) Categorie
// ---------------------------------------------------------
async function exportCategories() {
  try {
    const categorie = await catalogo.getAllCategories();
    saveJSON("categories.json", categorie);
    console.log("✅ Categorie esportate");
  } catch (err) {
    console.error("❌ Errore exportCategories:", err.message);
  }
}

// ---------------------------------------------------------
// 3) YouTube — estratto direttamente dai prodotti
// ---------------------------------------------------------
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
    console.log("🎥 YouTube esportato");
  } catch (err) {
    console.error("❌ Errore exportYouTube:", err.message);
  }
}

// ---------------------------------------------------------
// 4) Ordini
// ---------------------------------------------------------
async function exportOrders() {
  try {
    const rows = db.prepare("SELECT * FROM ordini ORDER BY id DESC").all();
    saveJSON("orders.json", rows);
    console.log("📦 Ordini esportati");
  } catch (err) {
    console.error("❌ Errore exportOrders:", err.message);
  }
}

// ---------------------------------------------------------
// 5) Vendite
// ---------------------------------------------------------
async function exportSales() {
  try {
    const rows = db.prepare("SELECT * FROM vendite ORDER BY id DESC").all();
    saveJSON("sales.json", rows);
    console.log("💰 Vendite esportate");
  } catch (err) {
    console.error("❌ Errore exportSales:", err.message);
  }
}

// ---------------------------------------------------------
// 6) Utenti
// ---------------------------------------------------------
async function exportUsers() {
  try {
    const rows = db.prepare("SELECT id, email, created_at FROM utenti").all();
    saveJSON("users.json", rows);
    console.log("👤 Utenti esportati");
  } catch (err) {
    console.error("❌ Errore exportUsers:", err.message);
  }
}

// ---------------------------------------------------------
// 7) Catalogo completo
// ---------------------------------------------------------
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

    const catalogoCompleto = { prodotti, categorie, youtube };
    saveJSON("catalog.json", catalogoCompleto);

    console.log("📚 Catalogo completo esportato");
  } catch (err) {
    console.error("❌ Errore exportCatalog:", err.message);
  }
}

// ---------------------------------------------------------
// 8) Esporta tutto
// ---------------------------------------------------------
async function exportAll() {
  console.log("⏳ Rigenerazione JSON…");

  await exportProducts();
  await exportCategories();
  await exportYouTube();
  await exportOrders();
  await exportSales();
  await exportUsers();
  await exportCatalog();

  console.log("✅ Tutti i JSON rigenerati (persistente + public)");
}

module.exports = {
  exportProducts,
  exportCategories,
  exportYouTube,
  exportOrders,
  exportSales,
  exportUsers,
  exportCatalog,
  exportAll
};
