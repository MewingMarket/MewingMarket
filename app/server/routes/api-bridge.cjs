// =========================================================
// File: app/server/routes/api-bridge.cjs
// Bridge API legacy → Airtable (catalogo, ordini, download,
// newsletter, utente finto)
// =========================================================

const express = require("express");
const Airtable = require("airtable");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE
// ---------------------------------------------------------
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;

if (!PAT || !BASE) {
  console.warn("⚠️ AIRTABLE_PAT o AIRTABLE_BASE non configurati");
}

const base = new Airtable({ apiKey: PAT }).base(BASE);

// Nomi tabelle (adattali se diversi)
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

// =========================================================
// 1) CATALOGO — /api/products
//    Usato da: home.js, catalogo.js
// =========================================================
router.get("/products", async (req, res) => {
  try {
    const records = await base(TABLE_PRODOTTI).select().all();

    const prodotti = records.map(r => {
      const allegati = safeGet(r, "Immagine") || [];
      const img =
        Array.isArray(allegati) && allegati[0] && allegati[0].url
          ? allegati[0].url
          : null;

      return {
        // formato "vecchio" che si aspetta il frontend
        id: r.id,
        titolo: safeGet(r, "Nome") || safeGet(r, "Titolo") || "Prodotto",
        slug: safeGet(r, "Slug") || "",
        prezzo: Number(safeGet(r, "Prezzo") || 0),
        descrizione: safeGet(r, "Descrizione") || "",
        descrizione_breve: safeGet(r, "Descrizione breve") || "",
        categoria: safeGet(r, "Categoria") || "",
        immagine: img,
        youtube_url: safeGet(r, "YouTube URL") || "",
        youtube_last_video_url: safeGet(r, "YouTube Last Video URL") || ""
      };
    });

    return res.json({ success: true, prodotti });
  } catch (err) {
    console.error("❌ Errore /api/products:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// 2) PRODOTTO SINGOLO — /api/products/:slug
//    Usato da: prodotto.js
// =========================================================
router.get("/products/:slug", async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return res.json({ success: false, error: "Slug mancante" });
  }

  try {
    const records = await base(TABLE_PRODOTTI)
      .select({
        filterByFormula: `{Slug} = '${slug}'`
      })
      .all();

    if (!records.length) {
      return res.json({ success: false, error: "Prodotto non trovato" });
    }

    const r = records[0];
    const allegati = safeGet(r, "Immagine") || [];
    const img =
      Array.isArray(allegati) && allegati[0] && allegati[0].url
        ? allegati[0].url
        : null;

    const prodotto = {
      id: r.id,
      titolo: safeGet(r, "Nome") || safeGet(r, "Titolo") || "Prodotto",
      titolo_breve: safeGet(r, "Titolo breve") || "",
      slug: safeGet(r, "Slug") || "",
      prezzo: Number(safeGet(r, "Prezzo") || 0),
      descrizione: safeGet(r, "Descrizione") || "",
      descrizione_breve: safeGet(r, "Descrizione breve") || "",
      categoria: safeGet(r, "Categoria") || "",
      immagine: img,
      youtube_url: safeGet(r, "YouTube URL") || "",
      youtube_last_video_url: safeGet(r, "YouTube Last Video URL") || ""
    };

    return res.json({ success: true, prodotto });
  } catch (err) {
    console.error("❌ Errore /api/products/:slug:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// 3) ORDINI UTENTE — /api/ordini/utente
//    Usato da: dashboard.js, ordini-utente.js, downloads
//    Header: Authorization: Bearer <session>, x-email: <email>
// =========================================================
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

// =========================================================
// 4) ANNULLA ORDINE — /api/ordini/annulla/:id
//    Usato da: dashboard.js (annulla ordine)
// =========================================================
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

// =========================================================
// 5) DOWNLOAD PROTETTI — /api/vendite/download/:slug
//    Usato da: dashboard.js (download), downloads.js
//    Header: x-email
// =========================================================
router.get("/vendite/download/:slug", async (req, res) => {
  const { slug } = req.params;
  const email = req.headers["x-email"];

  if (!slug || !email) {
    return res.status(400).send("Parametri mancanti");
  }

  try {
    // 1) Verifica che l'utente abbia acquistato il prodotto
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

    // 2) Recupera URL file dal prodotto
    const prodotti = await base(TABLE_PRODOTTI)
      .select({
        filterByFormula: `{Slug} = '${slug}'`
      })
      .all();

    if (!prodotti.length) {
      return res.status(404).send("Prodotto non trovato");
    }

    const pr = prodotti[0];

    // Prova prima campo "File URL", poi allegato "File"
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

    // Redirect diretto al file
    return res.redirect(fileUrl);
  } catch (err) {
    console.error("❌ Errore /api/vendite/download:", err);
    return res.status(500).send("Errore server");
  }
});

// =========================================================
// 6) NEWSLETTER — /newsletter/subscribe /unsubscribe
//    Usato da: subscribe.js, disiscrizione.js
//    Per ora: NO-OP con risposta ok
// =========================================================
router.post("/newsletter/subscribe", async (req, res) => {
  const { email } = req.body || {};
  console.log("📩 Richiesta iscrizione newsletter:", email);
  // Qui in futuro puoi integrare Brevo / altro
  return res.json({ status: "ok" });
});

router.post("/newsletter/unsubscribe", async (req, res) => {
  const { email } = req.body || {};
  console.log("📭 Richiesta disiscrizione newsletter:", email);
  // Qui in futuro puoi integrare Brevo / altro
  return res.json({ status: "ok" });
});

// =========================================================
// 7) UTENTE — endpoint finti per compatibilità frontend
//    Usati da: profilo.js, cambia-cred.js, reset-password.js
// =========================================================

// Cambio email (vecchia versione)
router.post("/utente/cambia-email", (req, res) => {
  console.log("👤 /api/utente/cambia-email (fake)", req.body);
  return res.json({ success: true });
});

// Cambio password (vecchia versione)
router.post("/utente/cambia-password", (req, res) => {
  console.log("👤 /api/utente/cambia-password (fake)", req.body);
  return res.json({ success: true });
});

// Cambio email (profilo.js)
router.post("/utente/profilo/cambia-email", (req, res) => {
  console.log("👤 /api/utente/profilo/cambia-email (fake)", req.body);
  return res.json({ success: true });
});

// Cambio password (profilo.js)
router.post("/utente/profilo/cambia-password", (req, res) => {
  console.log("👤 /api/utente/profilo/cambia-password (fake)", req.body);
  return res.json({ success: true });
});

// Elimina account (profilo.js + dashboard.js)
router.post("/utente/profilo/elimina", (req, res) => {
  console.log("👤 /api/utente/profilo/elimina (fake)");
  return res.json({ success: true });
});

// Reset password (se esiste nel frontend)
router.post("/utente/reset-password", (req, res) => {
  console.log("👤 /api/utente/reset-password (fake)", req.body);
  return res.json({ success: true });
});

module.exports = router;
