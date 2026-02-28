// FILE: routes/admin-ordini.cjs

const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/auth-admin.cjs"); // PATCH QUI

// ❌ Vecchio require (non esiste più)
// const base = require("../lib/airtable.cjs");

// ✅ Nuovo wrapper Airtable (corretto)
const Airtable = require("../lib/airtable-wrapper.cjs");

Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);

router.get("/ordini/lista", authAdmin, async (req, res) => {
  try {
    const records = await base("Vendite")
      .select({ sort: [{ field: "Timestamp", direction: "desc" }] })
      .all();

    const ordini = records.map(r => ({
      id: r.id,
      prodotto: r.get("Prodotto"),
      prezzo: r.get("Prezzo"),
      origine: r.get("Origine"),
      utm: {
        source: r.get("UTMSource"),
        medium: r.get("UTMMedium"),
        campaign: r.get("UTMCampaign")
      },
      referrer: r.get("Referrer"),
      device: r.get("Device"),
      lingua: r.get("Lingua"),
      data: r.get("Timestamp")
    }));

    res.json({ success: true, ordini });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Errore caricamento ordini" });
  }
});

module.exports = router;
