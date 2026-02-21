// =========================================================
// File: app/server/routes/api-prodotti.cjs
// Creazione + modifica prodotti (Airtable master)
// =========================================================

const express = require("express");
const router = express.Router();
const { airtable } = require("../services/airtable");

// LISTA PRODOTTI
router.get("/prodotti/lista", async (req, res) => {
  const records = await airtable("Prodotti").select().all();

  const prodotti = records.map(r => ({
    id: r.id,
    titolo: r.get("Titolo"),
    prezzo: r.get("Prezzo"),
    categoria: r.get("Categoria")
  }));

  res.json({ success: true, prodotti });
});

// SALVA PRODOTTO (nuovo o esistente)
router.post("/prodotti/save", async (req, res) => {
  const { id, titolo, descrizione, prezzo, categoria, slug, youtube, immagine, fileProdotto } = req.body;

  const fields = {
    Titolo: titolo,
    Descrizione: descrizione,
    Prezzo: prezzo,
    Categoria: categoria,
    Slug: slug,
    YouTube: youtube,
    Immagine: immagine,
    FileProdotto: fileProdotto
  };

  if (id) {
    await airtable("Prodotti").update(id, fields);
    return res.json({ success: true, id });
  }

  const created = await airtable("Prodotti").create(fields);
  return res.json({ success: true, id: created.id });
});

module.exports = router;
