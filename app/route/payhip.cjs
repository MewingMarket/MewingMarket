const express = require("express");
const router = express.Router();
const { syncPayhip } = require("../services/payhip.cjs");

router.get("/sync", async (req, res) => {
  try {
    console.log("⏳ È stata richiesta una sincronizzazione manuale del catalogo Payhip tramite API.");
    const result = await syncPayhip();
    console.log("✅ La sincronizzazione manuale del catalogo Payhip è terminata.");
    return res.json(result);
  } catch (err) {
    console.error("❌ Errore durante la sincronizzazione manuale del catalogo Payhip:", err?.message || err);
    return res.status(500).json({ success: false, error: "Errore durante la sincronizzazione Payhip" });
  }
});

module.exports = router;
