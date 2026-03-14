// =========================================================
// File: app/server/routes/api-prodotti.cjs
// Catalogo prodotti — Versione SQL definitiva
// =========================================================

const express = require("express");
const router = express.Router();

const catalogo = require("../../modules/catalogo-sql.cjs");

// =========================================================
// GET — LISTA PRODOTTI (SQL)
// =========================================================
router.get("/products", async (req, res) => {
  try {
    const prodotti = await catalogo.getAllProducts();
    return res.json({ success: true, prodotti });
  } catch (err) {
    console.error("API /products ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// GET — SINGOLO PRODOTTO PER SLUG (SQL)
// =========================================================
router.get("/products/:slug", async (req, res) => {
  try {
    const prodotto = await catalogo.getProductBySlug(req.params.slug);

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
// GET — PRODOTTO PER ID (SQL) — serve per delete
// =========================================================
router.get("/products/id/:id", async (req, res) => {
  try {
    const prodotto = await catalogo.getProductById(req.params.id);

    if (!prodotto) {
      return res.json({ success: false, error: "Prodotto non trovato" });
    }

    return res.json({ success: true, prodotto });
  } catch (err) {
    console.error("API /products/id ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST — CREA O MODIFICA PRODOTTO (SQL)
// =========================================================
router.post("/products/save", async (req, res) => {
  try {
    const data = req.body || {};

    if (!data.titolo || !data.slug) {
      return res.json({ success: false, error: "Titolo e slug obbligatori" });
    }

    const result = await catalogo.saveProduct(data);

    return res.json({ success: true, id: result.id });

  } catch (err) {
    console.error("API /products/save ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// DELETE — ELIMINA PRODOTTO (SQL)
// =========================================================
router.delete("/products/:slug", async (req, res) => {
  try {
    const ok = await catalogo.deleteProduct(req.params.slug);

    if (!ok) {
      return res.json({ success: false, error: "Prodotto non trovato" });
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("API DELETE /products/:slug ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
