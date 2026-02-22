const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin.cjs");
const base = require("../lib/airtable.cjs");

router.get("/feedback/lista", authAdmin, async (req, res) => {
  try {
    const records = await base("Feedback").select().all();

    const feedback = records.map(r => ({
      prodotto: r.get("Prodotto"),
      rating: r.get("Rating"),
      commento: r.get("Commento"),
      data: r.get("Timestamp")
    }));

    res.json({ success: true, feedback });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Errore caricamento feedback" });
  }
});

module.exports = router;
