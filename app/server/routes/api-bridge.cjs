// =========================================================
// File: app/server/routes/api-bridge.cjs
// Bridge API legacy → Catalogo automatico + Airtable (ordini)
// =========================================================

const express = require("express");
const Airtable = require("airtable");
const { getProducts } = require("../../modules/airtable.cjs");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (solo per ordini e download)
// ---------------------------------------------------------
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;

if (!PAT || !BASE) {
  console.warn("⚠️ AIRTABLE_PAT o AIRTABLE_BASE non configurati");
}

const base = new Airtable({ apiKey: PAT }).base(BASE);

// Tabelle
const TABLE_PRODOTTI = "Prodotti";
const TABLE_ORDINI = "Ordini";

// Helper sicuro
function safeGet(record, field) {
  try {
    return record.get(field) ?? null;
  } catch {
    return null;
  }
}

/* =========================================================
   1) CATALOGO — /api/products
   ORA USA products.json (catalogo automatico)
========================================================= */
router.get("/products", (req, res) => {
  try {
    const prodotti = getProducts(); // <-- catalogo automatico
    return res.json({ success: true, prodotti });
  } catch (err) {
    console.error("❌ Errore /api/products:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   2) PRODOTTO SINGOLO — /api/products/:slug
   ORA USA products.json (catalogo automatico)
========================================================= */
router.get("/products/:slug", (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return res.json({ success: false, error: "Slug mancante" });
  }

  try {
    const prodotti = getProducts(); // <-- catalogo automatico
    const prodotto = prodotti.find(p => p.slug === slug);

    if (!prodotto) {
      return res.json({ success: false, error: "Prodotto non trovato" });
    }

    return res.json({ success: true, prodotto });
  } catch (err) {
    console.error("❌ Errore /api/products/:slug:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   3) ORDINI UTENTE — /api/ordini/utente
   (rimane Airtable)
========================================================= */
router.get("/ordini/utente", async (req, res) => {
  const email = req.headers["x-email"];

  if (!email) {
    return res.json({ success: false, error: "Email mancante" });
  }

  try {
    const records = await base(TABLE_ORDINI)
      .select({
        filterByFormula: `{utente} = '${email}'`
      })
      .all();

    const ordini = records.map(r => {
      let prodotti = [];
      try {
        prodotti = JSON.parse(safeGet(r, "prodotti") || "[]");
      } catch {
        prodotti = [];
      }

      return {
        id: r.id,
        id_ordine: safeGet(r, "id_ordine") || null,
        utente: safeGet(r, "utente") || null,
        prodotti,
        totale: Number(safeGet(r, "totale") || 0),
        data: safeGet(r, "data") || r._rawJson.createdTime || null,
        stato: safeGet(r, "stato") || "sconosciuto",
        metodo_pagamento: safeGet(r, "metodo_pagamento") || "paypal",
        paypal_transaction_id: safeGet(r, "paypal_transaction_id") || null
      };
    });

    return res.json({ success: true, ordini });
  } catch (err) {
    console.error("❌ Errore /api/ordini/utente:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   4) ANNULLA ORDINE — /api/ordini/annulla/:id
========================================================= */
router.post("/ordini/annulla/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.json({ success: false, error: "ID mancante" });
  }

  try {
    await base(TABLE_ORDINI).update(id, {
      stato: "annullato"
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Errore /api/ordini/annulla:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   5) DOWNLOAD PROTETTI — /api/vendite/download/:slug
========================================================= */
router.get("/vendite/download/:slug", async (req, res) => {
  const { slug } = req.params;
  const email = req.headers["x-email"];

  if (!slug || !email) {
    return res.status(400).send("Parametri mancanti");
  }

  try {
    const ordini = await base(TABLE_ORDINI)
      .select({
        filterByFormula: `AND({utente} = '${email}', {stato} = 'completato')`
      })
      .all();

    let haAcquistato = false;

    for (const r of ordini) {
      let prodotti = [];
      try {
        prodotti = JSON.parse(safeGet(r, "prodotti") || "[]");
      } catch {
        prodotti = [];
      }

      if (prodotti.some(p => p.slug === slug)) {
        haAcquistato = true;
        break;
      }
    }

    if (!haAcquistato) {
      return res.status(403).send("Accesso negato");
    }

    const prodotti = await base(TABLE_PRODOTTI)
      .select({
        filterByFormula: `{Slug} = '${slug}'`
      })
      .all();

    if (!prodotti.length) {
      return res.status(404).send("Prodotto non trovato");
    }

    const pr = prodotti[0];

    const fileUrl =
      safeGet(pr, "File URL") ||
      (() => {
        const allegati = safeGet(pr, "File") || [];
        if (Array.isArray(allegati) && allegati[0] && allegati[0].url) {
          return allegati[0].url;
        }
        return null;
      })();

    if (!fileUrl) {
      return res.status(404).send("File non disponibile");
    }

    return res.redirect(fileUrl);
  } catch (err) {
    console.error("❌ Errore /api/vendite/download:", err);
    return res.status(500).send("Errore server");
  }
});

/* =========================================================
   6) NEWSLETTER — NO-OP
========================================================= */
router.post("/newsletter/subscribe", async (req, res) => {
  const { email } = req.body || {};
  console.log("📩 Richiesta iscrizione newsletter:", email);
  return res.json({ status: "ok" });
});

router.post("/newsletter/unsubscribe", async (req, res) => {
  const { email } = req.body || {};
  console.log("📭 Richiesta disiscrizione newsletter:", email);
  return res.json({ status: "ok" });
});

/* =========================================================
   7) UTENTE — endpoint finti (rimangono)
========================================================= */
router.post("/utente/cambia-email", (req, res) => {
  return res.json({ success: true });
});

router.post("/utente/cambia-password", (req, res) => {
  return res.json({ success: true });
});

router.post("/utente/profilo/cambia-email", (req, res) => {
  return res.json({ success: true });
});

router.post("/utente/profilo/cambia-password", (req, res) => {
  return res.json({ success: true });
});

router.post("/utente/profilo/elimina", (req, res) => {
  return res.json({ success: true });
});

router.post("/utente/reset-password", (req, res) => {
  return res.json({ success: true });
});

module.exports = router;
