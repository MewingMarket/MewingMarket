// =========================================================
// File: app/server/routes/api-prodotti.cjs
// Catalogo prodotti — Versione Airtable (completa)
// =========================================================

const express = require("express");
const router = express.Router();
const {
  getProducts,
  syncAirtable
} = require("../services/airtable.cjs");

const Airtable = require("airtable");

// Config Airtable
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;
const TABLE = process.env.AIRTABLE_TABLE_NAME;

// Helper base
const base = new Airtable({ apiKey: PAT }).base(BASE);
const tableName = decodeURIComponent(TABLE);

// =========================================================
// GET — LISTA PRODOTTI
// =========================================================
router.get("/products", async (req, res) => {
  try {
    if (!global.catalogReady) await syncAirtable();

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
// GET — SINGOLO PRODOTTO PER SLUG
// =========================================================
router.get("/products/:slug", async (req, res) => {
  try {
    if (!global.catalogReady) await syncAirtable();

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
// POST — CREA O MODIFICA PRODOTTO
// =========================================================
router.post("/products/save", async (req, res) => {
  try {
    const data = req.body;

    if (!data.titolo || !data.slug) {
      return res.json({ success: false, error: "Titolo e slug obbligatori" });
    }

    // Cerca record esistente
    const records = await base(tableName)
      .select({ filterByFormula: `{slug} = '${data.slug}'`, maxRecords: 1 })
      .all();

    const fields = {
      Titolo: data.titolo,
      Slug: data.slug,
      Prezzo: data.prezzo,
      DescrizioneLunga: data.descrizione,
      Immagine: data.immagine ? [{ url: data.immagine }] : [],
      File_consegna: data.fileProdotto ? [{ url: data.fileProdotto }] : []
    };

    let record;

    if (records.length) {
      // UPDATE
      record = await base(tableName).update(records[0].id, fields);
    } else {
      // CREATE
      record = await base(tableName).create(fields);
    }

    await syncAirtable();

    return res.json({ success: true, id: record.id });

  } catch (err) {
    console.error("API /products/save ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST — ELIMINA PRODOTTO
// =========================================================
router.post("/products/delete", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return res.json({ success: false, error: "ID mancante" });

    await base(tableName).destroy(id);

    await syncAirtable();

    return res.json({ success: true });

  } catch (err) {
    console.error("API /products/delete ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST — SYNC MANUALE DA AIRTABLE
// =========================================================
router.post("/products/sync", async (req, res) => {
  try {
    await syncAirtable();
    return res.json({ success: true });
  } catch (err) {
    console.error("API /products/sync ERROR:", err);
    return res.json({ success: false, error: "Errore sincronizzazione" });
  }
});

module.exports = router;
