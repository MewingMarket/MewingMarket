// FILE: routes/admin-stats.cjs

const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin.cjs");

// ❌ Vecchio require (non esiste più)
// const base = require("../lib/airtable.cjs");

// ✅ Nuovo wrapper Airtable
const Airtable = require("../lib/airtable-wrapper.cjs");

Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);

router.get("/stats", authAdmin, async (req, res) => {
  try {
    const vendite = await base("Vendite").select().all();
    const prodotti = await base("Catalogo Prodotti Digitali").select().all();

    res.json({
      success: true,
      stats: {
        venditeTotali: vendite.length,
        ordiniTotali: vendite.length,
        prodottiAttivi: prodotti.length
      }
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Errore caricamento stats" });
  }
});

module.exports = router;
