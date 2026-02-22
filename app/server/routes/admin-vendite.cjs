// FILE: routes/admin-vendite.cjs

const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin.cjs");
const base = require("../lib/airtable.cjs");

router.get("/vendite/lista", authAdmin, async (req, res) => {
  try {
    const records = await base("Vendite")
      .select({ sort: [{ field: "Timestamp", direction: "desc" }] })
      .all();

    const vendite = records.map(r => ({
      id: r.id,
      prodotto: r.get("Prodotto"),
      prezzo: r.get("Prezzo"),
      origine: r.get("Origine"),
      timestamp: r.get("Timestamp")
    }));

    res.json({ success: true, vendite });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Errore caricamento vendite" });
  }
});

module.exports = router;
