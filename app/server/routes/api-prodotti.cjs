// =========================================================
// File: app/server/routes/api-prodotti.cjs
// Catalogo prodotti — Versione SQL definitiva (ID-based)
// =========================================================

const express = require("express");
const router = express.Router();

const catalogo = require("../../modules/catalogo-sql.cjs");

// =========================================================
// GET — LISTA PRODOTTI (SQL)
// =========================================================
router.get("/prodotti", async (req, res) => {
  try {
    const prodotti = await catalogo.getAllProducts();
    return res.json(prodotti); // array diretto
  } catch (err) {
    console.error("API /prodotti ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// GET — SINGOLO PRODOTTO PER ID (SQL)
// =========================================================
router.get("/prodotti/:id", async (req, res) => {
  try {
    const prodotto = await catalogo.getProductById(req.params.id);

    if (!prodotto) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    return res.json(prodotto);
  } catch (err) {
    console.error("API /prodotti/:id ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// POST — CREA O MODIFICA PRODOTTO (SQL)
// body: { id?, titolo, descrizione_lunga, prezzo, immagine, fileProdotto }
// =========================================================
router.post("/prodotti", async (req, res) => {
  try {
    const data = req.body || {};

    if (!data.titolo || !data.prezzo) {
      return res.status(400).json({ error: "Titolo e prezzo obbligatori" });
    }

    // Normalizzazione campi per catalogo-sql.cjs
    data.immagine = data.immagine || null;
    data.fileProdotto = data.fileProdotto || null;

    const prodotto = await catalogo.saveProduct(data);

    return res.json(prodotto);

  } catch (err) {
    console.error("API POST /prodotti ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// DELETE — ELIMINA PRODOTTO (SQL) PER ID
// =========================================================
router.delete("/prodotti/:id", async (req, res) => {
  try {
    const ok = await catalogo.deleteProduct(req.params.id);

    if (!ok) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    return res.json({ ok: true });

  } catch (err) {
    console.error("API DELETE /prodotti/:id ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

module.exports = router;
