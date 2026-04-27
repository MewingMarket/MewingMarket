/* =========================================================
   FILE: app/server/routes/api-prodotti-new.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Catalogo prodotti — SQL definitivo (ID-based)
   ORIGINALE: ex /prodotti, /products, /genera-descrizione-ai, /delete
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app", p));

const catalogo = R("modules/catalogo-sql.cjs");
const jsonGen = R("server/modules/generatore-json.cjs");

/* =========================================================
   FUNZIONE 1 — getProdotti
   (ex GET /prodotti)
========================================================= */
async function getProdotti(req) {
  try {
    const prodotti = await catalogo.getAllProducts();
    return { success: true, prodotti };
  } catch (err) {
    console.error("❌ getProdotti ERROR:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   FUNZIONE 2 — getProdottoById
   (ex GET /prodotti/:id)
========================================================= */
async function getProdottoById(req) {
  try {
    const prodotto = await catalogo.getProductById(req.params.id);
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
   FUNZIONE 3 — salvaProdotto
   (ex POST /prodotti)
========================================================= */
async function salvaProdotto(req) {
  try {
    const data = req.body || {};

    if (!data.titolo || (!data.prezzo && !data.prezzo_cent)) {
      return { success: false, error: "Titolo e prezzo obbligatori" };
    }

    const prodotto = await catalogo.saveProduct(data);

    // MIRROR JSON
    try {
      await jsonGen.exportProducts();
      await jsonGen.exportCategories();
      await jsonGen.exportCatalog();
      console.log("✅ Mirror JSON aggiornato");
    } catch (errJson) {
      console.warn("⚠️ Mirror JSON fallito, ma SQL ok:", errJson.message);
    }

    return { success: true, prodotto };

  } catch (err) {
    console.error("❌ salvaProdotto ERROR:", err);
    return { success: false, error: "Errore durante il salvataggio" };
  }
}

/* =========================================================
   FUNZIONE 4 — generaDescrizioneAI
   (ex POST /prodotti/genera-descrizione-ai)
========================================================= */
async function generaDescrizioneAI(req) {
  try {
    const { titolo } = req.body;
    if (!titolo) {
      return { success: false, error: "Titolo mancante" };
    }

    const AI_RESULT = {
      success: true,
      descrizione_lunga: `<h3>Analisi di ${titolo}</h3><p>Descrizione ottimizzata generata dall'AI basata sul contenuto fornito...</p>`,
      descrizione_breve: `Tutto quello che devi sapere su ${titolo}.`
    };

    return AI_RESULT;

  } catch (err) {
    console.error("❌ generaDescrizioneAI ERROR:", err);
    return { success: false, error: "Servizio AI non disponibile" };
  }
}

/* =========================================================
   FUNZIONE 5 — eliminaProdotto
   (ex DELETE /prodotti/:id)
========================================================= */
async function eliminaProdotto(req) {
  try {
    const ok = await catalogo.deleteProduct(req.params.id);
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
   FUNZIONE 6 — getProductsPublic
   (ex GET /products)
========================================================= */
async function getProductsPublic(req) {
  try {
    const prodotti = await catalogo.getAllProducts();
    return { success: true, prodotti };
  } catch (err) {
    console.error("❌ getProductsPublic ERROR:", err);
    return { success: false, error: "Errore recupero prodotti" };
  }
}

/* =========================================================
   FUNZIONE 7 — getProductPublicById
   (ex GET /products/:id)
========================================================= */
async function getProductPublicById(req) {
  try {
    const prodotto = await catalogo.getProductById(req.params.id);
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
   EXPORT — stile Java
========================================================= */
module.exports = {
  getProdotti,
  getProdottoById,
  salvaProdotto,
  generaDescrizioneAI,
  eliminaProdotto,
  getProductsPublic,
  getProductPublicById
};
