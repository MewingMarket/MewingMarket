/* =========================================================
   FILE: app/server/routes/api-prodotti-new.cjs
   VERSIONE: 2027.3 — PATCH STABILE
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Catalogo prodotti — SQL definitivo (ID-based)
========================================================= */

const path = require("path");
const ROOT = process.cwd();
const R = (p) => require(path.join(ROOT, "app", p));

/* =========================================================
   REQUIRE ASSOLUTI
========================================================= */
const catalogo = R("modules/catalogo-sql.cjs");
const jsonGen = R("server/modules/generatore-json.cjs");
const pipeline = R("server/services/pipeline-prodotto.cjs");

/* =========================================================
   UTILS
========================================================= */
function safe(v, fallback = null) {
  return v === undefined || v === null ? fallback : v;
}

/* =========================================================
   ENDPOINT 0 — /api/prodotti-new
   Alias richiesto dal frontend
========================================================= */
async function prodottiNew(req) {
  console.log("[DEBUG prodotti] alias prodottiNew() → getProductsPublic()");
  return getProductsPublic(req);
}

/* =========================================================
   1) getProdotti (ADMIN)
========================================================= */
async function getProdotti(req) {
  console.log("[DEBUG prodotti] getProdotti()");

  try {
    const prodotti = catalogo.getAllProducts();
    return { success: true, prodotti };
  } catch (err) {
    console.error("❌ getProdotti ERROR:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   2) getProdottoById (ADMIN)
========================================================= */
async function getProdottoById(req) {
  console.log("[DEBUG prodotti] getProdottoById()", req.params);

  try {
    const id = req.params?.id;
    if (!id || isNaN(Number(id))) {
      return { success: false, error: "ID non valido" };
    }

    const prodotto = catalogo.getProductById(id);
    if (!prodotto) {
      return { success: false, error: "Prodotto non trovato" };
    }

    return { success: true, prodotto };

  } catch (err) {
    console.error("❌ getProdottoById ERROR:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   3) salvaProdotto (ADMIN)
   PATCH 2027.3 — competitor + fallback + sicurezza
========================================================= */
async function salvaProdotto(req) {
  console.log("[DEBUG prodotti] salvaProdotto()");

  try {
    const data = req.body || {};

    if (!data.titolo) {
      return { success: false, error: "Titolo obbligatorio" };
    }

    const prezzo = data.prezzo_cent || data.prezzo;
    if (!prezzo || isNaN(Number(prezzo))) {
      return { success: false, error: "Prezzo non valido" };
    }

    /* ---------------------------------------------------------
       Normalizzazione campi competitor
    --------------------------------------------------------- */
    const prodottoData = {
      ...data,

      percentuale_competitor: safe(data.percentuale_competitor),
      punteggio_saturazione: safe(data.punteggio_saturazione),
      punteggio_opportunita: safe(data.punteggio_opportunita),
      configurazione_consigliata: safe(data.configurazione_consigliata),

      categoria: safe(data.categoria, "generico"),
      prezzo_cent: Number(prezzo)
    };

    /* ---------------------------------------------------------
       SALVATAGGIO SQL
    --------------------------------------------------------- */
    const prodotto = catalogo.saveProduct(prodottoData);

    /* ---------------------------------------------------------
       MIRROR JSON
    --------------------------------------------------------- */
    try {
      await jsonGen.exportProducts();
      await jsonGen.exportCategories();
      await jsonGen.exportCatalog();
      console.log("✅ Mirror JSON aggiornato");
    } catch (errJson) {
      console.warn("⚠️ Mirror JSON fallito:", errJson.message);
    }

    /* ---------------------------------------------------------
       PIPELINE SOCIAL
    --------------------------------------------------------- */
    try {
      pipeline.pipelineProdotto(prodotto.id);
      console.log("🚀 Pipeline social avviata:", prodotto.id);
    } catch (errPipe) {
      console.error("⚠️ Errore pipeline:", errPipe.message);
    }

    return { success: true, prodotto };

  } catch (err) {
    console.error("❌ salvaProdotto ERROR:", err);
    return { success: false, error: "Errore durante il salvataggio" };
  }
}

/* =========================================================
   4) generaDescrizioneAI
========================================================= */
async function generaDescrizioneAI(req) {
  console.log("[DEBUG prodotti] generaDescrizioneAI()");

  try {
    const { titolo } = req.body;
    if (!titolo) {
      return { success: false, error: "Titolo mancante" };
    }

    return {
      success: true,
      descrizione_lunga: `<h3>Analisi di ${titolo}</h3><p>Descrizione ottimizzata generata dall'AI...</p>`,
      descrizione_breve: `Tutto quello che devi sapere su ${titolo}.`
    };

  } catch (err) {
    console.error("❌ generaDescrizioneAI ERROR:", err);
    return { success: false, error: "Servizio AI non disponibile" };
  }
}

/* =========================================================
   5) eliminaProdotto (ADMIN)
========================================================= */
async function eliminaProdotto(req) {
  console.log("[DEBUG prodotti] eliminaProdotto()", req.params);

  try {
    const id = req.params?.id;
    if (!id || isNaN(Number(id))) {
      return { success: false, error: "ID non valido" };
    }

    const ok = catalogo.deleteProduct(id);
    if (!ok) {
      return { success: false, error: "Prodotto non trovato" };
    }

    await jsonGen.exportProducts();
    await jsonGen.exportCategories();
    await jsonGen.exportCatalog();

    return { success: true };

  } catch (err) {
    console.error("❌ eliminaProdotto ERROR:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   6) getProductsPublic (FRONTEND)
========================================================= */
async function getProductsPublic(req) {
  console.log("[DEBUG prodotti] getProductsPublic()");

  try {
    const prodotti = catalogo.getAllProducts();
    return { success: true, prodotti };
  } catch (err) {
    console.error("❌ getProductsPublic ERROR:", err);
    return { success: false, error: "Errore recupero prodotti" };
  }
}

/* =========================================================
   7) getProductPublicById (FRONTEND)
========================================================= */
async function getProductPublicById(req) {
  console.log("[DEBUG prodotti] getProductPublicById()", req.params);

  try {
    const id = req.params?.id;
    if (!id || isNaN(Number(id))) {
      return { success: false, error: "ID non valido" };
    }

    const prodotto = catalogo.getProductById(id);
    if (!prodotto) {
      return { success: false, error: "Non trovato" };
    }

    return { success: true, prodotto };

  } catch (err) {
    console.error("❌ getProductPublicById ERROR:", err);
    return { success: false, error: "Errore recupero prodotto" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function getProducts(req) { return getProductsPublic(req); }
async function getProduct(req) { return getProductPublicById(req); }
async function deleteProdotto(req) { return eliminaProdotto(req); }

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  prodottiNew, // /api/prodotti-new

  getProdotti,
  getProdottoById,
  salvaProdotto,
  generaDescrizioneAI,
  eliminaProdotto,
  getProductsPublic,
  getProductPublicById,

  // alias compatibilità
  getProducts,
  getProduct,
  deleteProdotto
};
