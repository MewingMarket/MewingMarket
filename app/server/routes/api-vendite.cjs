// =========================================================
// File: app/server/routes/api-vendite.cjs
// Gestione vendite — Model A (ordine unico)
// =========================================================

const express = require("express");
const router = express.Router();
const Airtable = require("airtable");
const { getSalesByUID } = require("../modules/airtable.cjs");

// Config Airtable
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;
const TABLE = "Vendite"; // Tabella vendite

const base = new Airtable({ apiKey: PAT }).base(BASE);

// =========================================================
// POST — CREA ORDINE (MODEL A)
// =========================================================
router.post("/vendite/crea", async (req, res) => {
  try {
    const { uid, email, prodotti, totale } = req.body;

    if (!uid || !email || !Array.isArray(prodotti) || prodotti.length === 0) {
      return res.json({ success: false, error: "Dati ordine mancanti" });
    }

    const record = await base(TABLE).create({
      uid,
      email,
      prodotti: JSON.stringify(prodotti),
      totale,
      data: new Date().toISOString(),
      stato: "completato"
    });

    return res.json({
      success: true,
      ordine_id: record.id
    });

  } catch (err) {
    console.error("❌ Errore /vendite/crea:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// GET — ORDINI UTENTE
// =========================================================
router.get("/vendite/utente/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const vendite = await getSalesByUID(uid);

    return res.json({
      success: true,
      vendite
    });

  } catch (err) {
    console.error("❌ Errore /vendite/utente:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// GET — DOWNLOAD PROTETTO
// =========================================================
router.get("/vendite/download/:slug", async (req, res) => {
  try {
    const session = req.headers["x-session"];
    if (!session) {
      return res.status(401).json({ success: false, error: "Non autorizzato" });
    }

    const uid = session;
    const slug = req.params.slug;

    const vendite = await getSalesByUID(uid);

    const haComprato = vendite.some(v => {
      try {
        const prodotti = JSON.parse(v.prodotti || "[]");
        return prodotti.some(p => p.slug === slug);
      } catch {
        return false;
      }
    });

    if (!haComprato) {
      return res.status(403).json({ success: false, error: "Non hai acquistato questo prodotto" });
    }

    // Recupera file prodotto da Airtable
    const prodotti = require("../modules/airtable.cjs").getProducts();
    const prodotto = prodotti.find(p => p.slug === slug);

    if (!prodotto || !prodotto.fileProdotto) {
      return res.status(404).json({ success: false, error: "File non disponibile" });
    }

    return res.redirect(prodotto.fileProdotto);

  } catch (err) {
    console.error("❌ Errore /vendite/download:", err);
    return res.status(500).json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
