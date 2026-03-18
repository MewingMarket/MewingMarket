// =========================================================
// File: app/server/routes/api-prodotti-new.cjs
// Catalogo prodotti — Versione SQL definitiva (ID-based)
// Con mirroring JSON automatico
// =========================================================

const express = require("express");
const router = express.Router();

// PATCH: catalogo sta in app/modules/
const catalogo = require("../../modules/catalogo-sql.cjs");

// PATCH: fix nome variabile
const jsonGen = require("../modules/generatore-json.cjs");

// =========================================================
// GET — LISTA PRODOTTI (SQL) — ADMIN
// =========================================================
router.get("/prodotti", async (req, res) => {
  try {
    const prodotti = await catalogo.getAllProducts();
    return res.json(prodotti);
  } catch (err) {
    console.error("API /prodotti ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// GET — SINGOLO PRODOTTO PER ID (SQL) — ADMIN
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
// POST — CREA O MODIFICA PRODOTTO (SQL) — ADMIN
// =========================================================
router.post("/prodotti", async (req, res) => {
  try {
    const data = req.body || {};

    if (!data.titolo || !data.prezzo) {
      return res.status(400).json({ error: "Titolo e prezzo obbligatori" });
    }

    data.immagine = data.immagine || null;
    data.fileProdotto = data.fileProdotto || null;

    const prodotto = await catalogo.saveProduct(data);

    // MIRROR JSON
    await jsonGen.exportProducts();
    await jsonGen.exportCategories();
    await jsonGen.exportCatalog();

    return res.json(prodotto);

  } catch (err) {
    console.error("API POST /prodotti ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// DELETE — ELIMINA PRODOTTO (SQL) — ADMIN
// =========================================================
router.delete("/prodotti/:id", async (req, res) => {
  try {
    const ok = await catalogo.deleteProduct(req.params.id);

    if (!ok) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    // MIRROR JSON
    await jsonGen.exportProducts();
    await jsonGen.exportCategories();
    await jsonGen.exportCatalog();

    return res.json({ ok: true });

  } catch (err) {
    console.error("API DELETE /prodotti/:id ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// FRONTEND API — /api/products
// =========================================================

// LISTA PRODOTTI (frontend)
router.get("/products", async (req, res) => {
  try {
    const prodotti = await catalogo.getAllProducts();
    return res.json({ success: true, prodotti });
  } catch (err) {
    console.error("API /products ERROR:", err);
    return res.status(500).json({ success: false, error: "Errore server" });
  }
});

// SINGOLO PRODOTTO (frontend)
router.get("/products/:id", async (req, res) => {
  try {
    const prodotto = await catalogo.getProductById(req.params.id);

    if (!prodotto) {
      return res.status(404).json({ success: false, error: "Prodotto non trovato" });
    }

    return res.json({ success: true, prodotto });
  } catch (err) {
    console.error("API /products/:id ERROR:", err);
    return res.status(500).json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
