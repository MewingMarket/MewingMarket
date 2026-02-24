// =========================================================
// File: app/server/routes/api-bridge.cjs
// Bridge API legacy → Catalogo automatico + Ordini reali
// Versione definitiva (Airtable nuova SDK, percorsi corretti)
// =========================================================

const express = require("express");
const Airtable = require("../lib/airtable-wrapper.cjs");
const { getProducts } = require("../../modules/airtable.cjs");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (nuova SDK, blindata)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);

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
   1) CATALOGO AUTOMATICO — /api/products
========================================================= */
router.get("/products", (req, res) => {
  try {
    const prodotti = getProducts();
    return res.json({ success: true, prodotti });
  } catch (err) {
    console.error("❌ Errore /api/products:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   2) PRODOTTO SINGOLO — /api/products/:slug
========================================================= */
router.get("/products/:slug", (req, res) => {
  const { slug } = req.params;

  try {
    const prodotti = getProducts();
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
   3) ORDINI REALI — /api/ordini/utente
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
        id_ordine: safeGet(r, "id_ordine"),
        utente: safeGet(r, "utente"),
        prodotti,
        totale: Number(safeGet(r, "totale") || 0),
        data: safeGet(r, "data") || r._rawJson.createdTime,
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
   5) DOWNLOAD REALI — /api/vendite/download/:slug
========================================================= */
router.get("/vendite/download/:slug", async (req, res) => {
  const { slug } = req.params;
  const email = req.headers["x-email"];

  if (!slug || !email) {
    return res.status(400).send("Parametri mancanti");
  }

  try {
    // 1) Verifica acquisto COMPLETATO
    const ordini = await base(TABLE_ORDINI)
      .select({
        filterByFormula: `AND({utente} = '${email}', {stato} = 'COMPLETED')`
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

    // 2) Recupera file da Airtable
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
      safeGet(pr, "File_consegna")?.[0]?.url ||
      safeGet(pr, "File")?.[0]?.url ||
      safeGet(pr, "File URL") ||
      null;

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
   6) NEWSLETTER REALE (Brevo-ready)
========================================================= */
router.post("/newsletter/subscribe", async (req, res) => {
  const { email } = req.body || {};

  if (!email) return res.json({ status: "error", error: "Email mancante" });

  if (process.env.BREVO_API_KEY) {
    try {
      const fetch = (await import("node-fetch")).default;

      await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY
        },
        body: JSON.stringify({ email, listIds: [8] })
      });

      return res.json({ status: "ok" });
    } catch (err) {
      console.error("❌ Newsletter Brevo:", err);
      return res.json({ status: "error" });
    }
  }

  console.log("📩 Newsletter (fallback):", email);
  return res.json({ status: "ok" });
});

router.post("/newsletter/unsubscribe", async (req, res) => {
  const { email } = req.body || {};

  if (!email) return res.json({ status: "error", error: "Email mancante" });

  if (process.env.BREVO_API_KEY) {
    try {
      const fetch = (await import("node-fetch")).default;

      await fetch(`https://api.brevo.com/v3/contacts/${email}`, {
        method: "DELETE",
        headers: {
          "api-key": process.env.BREVO_API_KEY
        }
      });

      return res.json({ status: "ok" });
    } catch (err) {
      console.error("❌ Newsletter Brevo:", err);
      return res.json({ status: "error" });
    }
  }

  console.log("📭 Unsubscribe (fallback):", email);
  return res.json({ status: "ok" });
});

module.exports = router;
