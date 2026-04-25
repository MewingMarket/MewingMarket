// =========================================================
// File: app/server/routes/api-prodotti-new.cjs
// Catalogo prodotti — Versione SQL definitiva (ID-based)
// PATCH 2027.500 — Sync AI + YouTube + Categories
// =========================================================

const express = require("express");
const path = require("path");
const router = express.Router();

// Helper require assoluto
const R = (p) => require(path.join(process.cwd(), "app", p));

const catalogo = R("modules/catalogo-sql.cjs");
const jsonGen = R("server/modules/generatore-json.cjs");

// Se hai un modulo AI separato, caricalo qui, altrimenti usa un placeholder
// const aiService = R("server/modules/ai-service.cjs");

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

    // Normalizzazione campi per il DB SQL
    const payload = {
      id: data.id || null,
      titolo: data.titolo,
      titolo_breve: data.titolo_breve || data.titolo,
      descrizione_lunga: data.descrizione_lunga || "",
      descrizione_breve: data.descrizione_breve || "",
      // Gestione prezzo in centesimi per evitare errori floating point
      prezzo_cent: data.prezzo_cent || Math.round(parseFloat(data.prezzo) * 100),
      immagine: data.immagine || null,
      fileProdotto: data.fileProdotto || null,
      categoria: data.categoria || "Generale",
      youtube_video_id: data.youtube_video_id || null
    };

    const prodotto = await catalogo.saveProduct(payload);

    // MIRROR JSON (Rigenera i file statici per il frontend)
    try {
      await jsonGen.exportProducts();
      await jsonGen.exportCategories();
      await jsonGen.exportCatalog();
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

    // Qui chiameresti il tuo servizio Llama/OpenAI
    // Simuliamo una risposta strutturata
    const AI_RESULT = {
      success: true,
      descrizione_lunga: `<h3>Scopri ${titolo}</h3><p>Contenuto ottimizzato generato automaticamente...</p>`,
      descrizione_breve: `La guida definitiva a ${titolo}.`
    };

    return res.json(AI_RESULT);
  } catch (err) {
    return res.status(500).json({ success: false, error: "AI Service indisponibile" });
  }
});

// =========================================================
// ADMIN: DELETE
// =========================================================
router.delete("/prodotti/:id", async (req, res) => {
  try {
    const ok = await catalogo.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: "Prodotto non trovato" });

    await jsonGen.exportProducts();
    await jsonGen.exportCategories();
    await jsonGen.exportCatalog();

    return res.json({ ok: true, success: true });
  } catch (err) {
    return res.status(500).json({ error: "Errore server" });
  }
});

// =========================================================
// FRONTEND: API PUBBLICHE
// =========================================================

router.get("/products", async (req, res) => {
  try {
    const prodotti = await catalogo.getAllProducts();
    // Wrap coerente con quello che si aspetta catalogo.js
    return res.json({ success: true, prodotti });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Errore" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const prodotto = await catalogo.getProductById(req.params.id);
    if (!prodotto) return res.status(404).json({ success: false, error: "Non trovato" });
    return res.json({ success: true, prodotto });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Errore" });
  }
});

module.exports = router;
