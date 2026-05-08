/* =========================================================
   FILE: app/server/routes/api-prodotti-new.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Catalogo prodotti — SQL definitivo (ID-based)
   COMPATIBILE CON:
   - immagine_url
   - file_consegna_url
   - config_json
   - categorie automatiche
   - pipeline social automatica
========================================================= */

const path = require("path");
const ROOT = process.cwd();
const R = (p) => require(path.join(ROOT, "app", p));

/* =========================================================
   REQUIRE ASSOLUTI
========================================================= */
const catalogo = R("modules/catalogo-sql.cjs");
const jsonGen = R("server/modules/generatore-json.cjs");

/* =========================================================
   PIPELINE SOCIAL (Java‑mode)
========================================================= */
const pipeline = R("server/services/pipeline-prodotto.cjs");

/* =========================================================
   FUNZIONE 1 — getProdotti (ADMIN)
========================================================= */
async function getProdotti(req) {
  console.log("[DEBUG prodotti] getProdotti()");

  try {
    const prodotti = catalogo.getAllProducts(); // SINCRONO
    return { success: true, prodotti };
  } catch (err) {
    console.error("❌ getProdotti ERROR:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   FUNZIONE 2 — getProdottoById (ADMIN)
========================================================= */
async function getProdottoById(req) {
  console.log("[DEBUG prodotti] getProdottoById()", req.params);

  try {
    const prodotto = catalogo.getProductById(req.params.id); // SINCRONO
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
   FUNZIONE 3 — salvaProdotto (ADMIN)
   🔥 QUI PARTE LA PIPELINE SOCIAL
========================================================= */
async function salvaProdotto(req) {
  console.log("[DEBUG prodotti] salvaProdotto()");

  try {
    const data = req.body || {};

    if (!data.titolo || (!data.prezzo && !data.prezzo_cent)) {
      return { success: false, error: "Titolo e prezzo obbligatori" };
    }

    // SUPPORTO COMPLETO:
    // - immagine_url
    // - file_consegna_url
    // - config_json
    // - categorie automatiche
    const prodotto = catalogo.saveProduct(data); // SINCRONO

    try {
      await jsonGen.exportProducts();
      await jsonGen.exportCategories();
      await jsonGen.exportCatalog();
      console.log("✅ Mirror JSON aggiornato");
    } catch (errJson) {
      console.warn("⚠️ Mirror JSON fallito, ma SQL ok:", errJson.message);
    }

    /* =========================================================
       🔥 AGGANCIO PIPELINE SOCIAL
       Il prodotto è ora nel catalogo SQL → pipeline parte.
       NON BLOCCA la risposta al frontend.
    ========================================================== */
    try {
      pipeline.pipelineProdotto(prodotto.id);
      console.log("🚀 Pipeline social avviata per prodotto:", prodotto.id);
    } catch (errPipe) {
      console.error("⚠️ Errore avvio pipeline:", errPipe.message);
    }

    return { success: true, prodotto };

  } catch (err) {
    console.error("❌ salvaProdotto ERROR:", err);
    return { success: false, error: "Errore durante il salvataggio" };
  }
}

/* =========================================================
   FUNZIONE 4 — generaDescrizioneAI (placeholder)
========================================================= */
async function generaDescrizioneAI(req) {
  console.log("[DEBUG prodotti] generaDescrizioneAI()");

  try {
    const { titolo } = req.body;
    if (!titolo) {
      return { success: false, error: "Titolo mancante" };
    }

    // Placeholder — la tua AI reale è in api-prodotti-ai.cjs
    return {
      success: true,
      descrizione_lunga: `<h3>Analisi di ${titolo}</h3><p>Descrizione ottimizzata generata dall'AI basata sul contenuto fornito...</p>`,
      descrizione_breve: `Tutto quello che devi sapere su ${titolo}.`
    };

  } catch (err) {
    console.error("❌ generaDescrizioneAI ERROR:", err);
    return { success: false, error: "Servizio AI non disponibile" };
  }
}

/* =========================================================
   FUNZIONE 5 — eliminaProdotto (ADMIN)
========================================================= */
async function eliminaProdotto(req) {
  console.log("[DEBUG prodotti] eliminaProdotto()", req.params);

  try {
    const ok = catalogo.deleteProduct(req.params.id); // SINCRONO
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
   FUNZIONE 6 — getProductsPublic (FRONTEND)
========================================================= */
async function getProductsPublic(req) {
  console.log("[DEBUG prodotti] getProductsPublic()");

  try {
    const prodotti = catalogo.getAllProducts(); // SINCRONO
    return { success: true, prodotti };
  } catch (err) {
    console.error("❌ getProductsPublic ERROR:", err);
    return { success: false, error: "Errore recupero prodotti" };
  }
}

/* =========================================================
   FUNZIONE 7 — getProductPublicById (FRONTEND)
========================================================= */
async function getProductPublicById(req) {
  console.log("[DEBUG prodotti] getProductPublicById()", req.params);

  try {
    const prodotto = catalogo.getProductById(req.params.id); // SINCRONO
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
async function getProducts(req) {
  console.log("[DEBUG prodotti] alias getProducts() → getProductsPublic()");
  return getProductsPublic(req);
}

async function getProduct(req) {
  console.log("[DEBUG prodotti] alias getProduct() → getProductPublicById()");
  return getProductPublicById(req);
}

async function deleteProdotto(req) {
  console.log("[DEBUG prodotti] alias deleteProdotto() → eliminaProdotto()");
  return eliminaProdotto(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
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
