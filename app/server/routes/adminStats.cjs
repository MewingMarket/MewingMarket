const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin.cjs");
const base = require("../lib/airtable.cjs");

router.get("/stats", authAdmin, async (req, res) => {
  try {
    const vendite = await base(process.env.AIRTABLE_SALES).select().all();
    const prodotti = await base(process.env.AIRTABLE_PRODUCTS).select().all();

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
