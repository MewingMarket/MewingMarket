// =========================================================
// File: app/server/routes/api-prodotti.cjs
// Catalogo prodotti — Versione FILE + Airtable per admin
// =========================================================

const express = require("express");
const Airtable = require("../lib/airtable-wrapper.cjs");
const { getProducts, syncAirtable } = require("../../modules/airtable-sync.cjs");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (per operazioni admin: save/delete/sync)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);
const tableName = decodeURIComponent(process.env.AIRTABLE_TABLE_NAME);

// Helper sicuro
function safeGet(record, field) {
  try {
    return record.get(field) ?? null;
  } catch {
    return null;
  }
}

// =========================================================
// GET — LISTA PRODOTTI (SOLO FILE, NESSUNA SYNC)
// =========================================================
router.get("/products", async (req, res) => {
  try {
    const prodotti = getProducts();

    return res.json({
      success: true,
      prodotti
    });

  } catch (err) {
    console.error("API /products ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// GET — SINGOLO PRODOTTO PER SLUG (SOLO FILE, NESSUNA SYNC)
// =========================================================
router.get("/products/:slug", async (req, res) => {
  try {
    const prodotti = getProducts();
    const prodotto = prodotti.find(p => p.slug === req.params.slug);

    if (!prodotto) {
      return res.json({ success: false, error: "Prodotto non trovato" });
    }

    return res.json({ success: true, prodotto });

  } catch (err) {
    console.error("API /products/:slug ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST — CREA O MODIFICA PRODOTTO (USA AIRTABLE + SYNC)
// =========================================================
router.post("/products/save", async (req, res) => {
  try {
    const data = req.body || {};

    if (!data.titolo || !data.slug) {
      return res.json({ success: false, error: "Titolo e slug obbligatori" });
    }

    const records = await base(tableName)
      .select({
        filterByFormula: `{slug} = '${data.slug}'`,
        maxRecords: 1
      })
      .all();

    const fields = {
      Titolo: data.titolo,
      Slug: data.slug,
      Prezzo: Number(data.prezzo || 0),
      DescrizioneLunga: data.descrizione || "",
      Immagine: data.immagine ? [{ url: data.immagine }] : [],
      File_consegna: data.fileProdotto ? [{ url: data.fileProdotto }] : []
    };

    let record;

    if (records.length) {
      record = await base(tableName).update(records[0].id, fields);
    } else {
      record = await base(tableName).create(fields);
    }

    // Dopo modifica, aggiorna il file locale
    await syncAirtable();

    return res.json({ success: true, id: record.id });

  } catch (err) {
    console.error("API /products/save ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST — ELIMINA PRODOTTO (USA AIRTABLE + SYNC)
// =========================================================
router.post("/products/delete", async (req, res) => {
  try {
    const { id } = req.body || {};

    if (!id) {
      return res.json({ success: false, error: "ID mancante" });
    }

    await base(tableName).destroy(id);

    // Dopo delete, aggiorna il file locale
    await syncAirtable();

    return res.json({ success: true });

  } catch (err) {
    console.error("API /products/delete ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST — SYNC MANUALE (ADMIN) — OPZIONALE
// =========================================================
router.post("/products/sync", async (req, res) => {
  try {
    const ok = await syncAirtable();
    return res.json({ success: ok });
  } catch (err) {
    console.error("API /products/sync ERROR:", err);
    return res.json({ success: false, error: "Errore sincronizzazione" });
  }
});

module.exports = router;
