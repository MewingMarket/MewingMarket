// =========================================================
// File: app/server/routes/api-prodotti-new.cjs
// Catalogo prodotti — Versione SQL definitiva (ID-based)
// PATCH 2027.500 — Sync AI + Mirroring Automatico
// =========================================================

const express = require("express");
const path = require("path");
const router = express.Router();

// Helper require assoluto
const R = (p) => require(path.join(process.cwd(), "app", p));

const catalogo = R("modules/catalogo-sql.cjs");
const jsonGen = R("server/modules/generatore-json.cjs");

// =========================================================
// ADMIN: GET LISTA & SINGOLO
// =========================================================
router.get("/prodotti", async (req, res) => {
  try {
    const prodotti = await catalogo.getAllProducts();
    return res.json(prodotti);
  } catch (err) {
    console.error("API /prodotti ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

router.get("/prodotti/:id", async (req, res) => {
  try {
    const prodotto = await catalogo.getProductById(req.params.id);
    if (!prodotto) return res.status(404).json({ error: "Prodotto non trovato" });
    return res.json(prodotto);
  } catch (err) {
    console.error("API /prodotti/:id ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// ADMIN: SALVA (CREA O MODIFICA)
// =========================================================
router.post("/prodotti", async (req, res) => {
  try {
    const data = req.body || {};

    if (!data.titolo || (!data.prezzo && !data.prezzo_cent)) {
      return res.status(400).json({ error: "Titolo e prezzo obbligatori" });
    }

    // Passiamo i dati direttamente al catalogo-sql.cjs
    // Lui estrarrà categorie e YouTube ID automaticamente
    const prodotto = await catalogo.saveProduct(data);

    // MIRROR JSON (Rigenera i file statici per il frontend e la cache)
    try {
      await jsonGen.exportProducts();
      await jsonGen.exportCategories();
      await jsonGen.exportCatalog();
      console.log("✅ Mirror JSON aggiornato");
    } catch (errJson) {
      console.warn("⚠️ Mirror JSON fallito, ma SQL ok:", errJson.message);
    }

    return res.json(prodotto);

  } catch (err) {
    console.error("API POST /prodotti ERROR:", err);
    return res.status(500).json({ error: "Errore durante il salvataggio" });
  }
});

// =========================================================
// ADMIN: GENERA DESCRIZIONE AI
// =========================================================
router.post("/prodotti/genera-descrizione-ai", async (req, res) => {
  try {
    const { titolo, contenuto } = req.body;
    if (!titolo) return res.status(400).json({ success: false, error: "Titolo mancante" });

    // Placeholder per integrazione futura AI (Llama/OpenAI)
    const AI_RESULT = {
      success: true,
      descrizione_lunga: `<h3>Analisi di ${titolo}</h3><p>Descrizione ottimizzata generata dall'AI basata sul contenuto fornito...</p>`,
      descrizione_breve: `Tutto quello che devi sapere su ${titolo}.`
    };

    return res.json(AI_RESULT);
  } catch (err) {
    return res.status(500).json({ success: false, error: "Servizio AI non disponibile" });
  }
});

// =========================================================
// ADMIN: DELETE
// =========================================================
router.delete("/prodotti/:id", async (req, res) => {
  try {
    const ok = await catalogo.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: "Prodotto non trovato" });

    // Aggiorna i file statici dopo l'eliminazione
    await jsonGen.exportProducts();
    await jsonGen.exportCategories();
    await jsonGen.exportCatalog();

    return res.json({ ok: true, success: true });
  } catch (err) {
    console.error("API DELETE /prodotti/:id ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// FRONTEND: API PUBBLICHE (/api/products)
// =========================================================

router.get("/products", async (req, res) => {
  try {
    const prodotti = await catalogo.getAllProducts();
    // Wrap coerente per il caricamento dinamico del catalogo frontend
    return res.json({ success: true, prodotti });
  } catch (err) {
    console.error("API /products ERROR:", err);
    return res.status(500).json({ success: false, error: "Errore recupero prodotti" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const prodotto = await catalogo.getProductById(req.params.id);
    if (!prodotto) return res.status(404).json({ success: false, error: "Non trovato" });
    
    return res.json({ success: true, prodotto });
  } catch (err) {
    console.error("API /products/:id ERROR:", err);
    return res.status(500).json({ success: false, error: "Errore recupero prodotto" });
  }
});

module.exports = router;
