// =========================================================
// File: app/server/routes/api-prodotti.cjs
// Catalogo prodotti — versione definitiva (no Airtable)
// Compatibile con store, admin, bot, PayPal
// =========================================================

const express = require("express");
const router = express.Router();
const Prodotto = require("../models/Prodotto"); // MODEL DB

/* ============================================================
   GET — LISTA COMPLETA PRODOTTI
============================================================ */
router.get("/prodotti/list", async (req, res) => {
  try {
    const prodotti = await Prodotto.find().sort({ ordine: 1 });

    return res.json({
      success: true,
      products: prodotti
    });

  } catch (err) {
    console.error("API /prodotti/list ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* ============================================================
   GET — SINGOLO PRODOTTO PER SLUG
============================================================ */
router.get("/prodotti/:slug", async (req, res) => {
  try {
    const prodotto = await Prodotto.findOne({ slug: req.params.slug });

    if (!prodotto) {
      return res.json({ success: false, error: "Prodotto non trovato" });
    }

    return res.json({ success: true, product: prodotto });

  } catch (err) {
    console.error("API /prodotti/:slug ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* ============================================================
   POST — CREA O MODIFICA PRODOTTO
============================================================ */
router.post("/prodotti/save", async (req, res) => {
  try {
    const data = req.body;

    // Validazione minima
    if (!data.titolo || !data.slug) {
      return res.json({ success: false, error: "Titolo e slug sono obbligatori" });
    }

    let prodotto;

    if (data.id) {
      // UPDATE
      prodotto = await Prodotto.findByIdAndUpdate(data.id, data, { new: true });
    } else {
      // CREATE
      prodotto = await Prodotto.create(data);
    }

    return res.json({ success: true, product: prodotto });

  } catch (err) {
    console.error("API /prodotti/save ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* ============================================================
   POST — ELIMINA PRODOTTO
============================================================ */
router.post("/prodotti/delete", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.json({ success: false, error: "ID mancante" });
    }

    await Prodotto.findByIdAndDelete(id);

    return res.json({ success: true });

  } catch (err) {
    console.error("API /prodotti/delete ERROR:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
