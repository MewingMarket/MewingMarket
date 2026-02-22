// =========================================================
// File: app/server/routes/api-ordini.cjs
// Lista vendite (Admin) — Model A
// =========================================================

const express = require("express");
const router = express.Router();
const Airtable = require("airtable");

// Config Airtable
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;
const TABLE = "Vendite";

const base = new Airtable({ apiKey: PAT }).base(BASE);

// =========================================================
// GET — LISTA VENDITE (ADMIN)
// =========================================================
router.get("/vendite/lista", async (req, res) => {
  try {
    const records = await base(TABLE).select().all();

    const vendite = records.map(r => {
      let prodotti = [];

      try {
        prodotti = JSON.parse(r.get("prodotti") || "[]");
      } catch {
        prodotti = [];
      }

      return {
        id: r.id,
        data: r.get("data"),
        email: r.get("email"),
        totale: r.get("totale"),
        stato: r.get("stato"),
        prodotti
      };
    });

    return res.json({ success: true, vendite });

  } catch (err) {
    console.error("❌ Errore /vendite/lista:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
