// FILE: app/server/routes/admin-prodotti-ai.cjs
// VERSIONE: Competitor Intelligence 2027.2 (PATCH STABILE)
// FUNZIONI:
// - getprodottidacreare
// - approvaprodotto (con config + competitor + prezzo consigliato)
// - eliminaprodottodacreare

const path = require("path");
const ROOT = process.cwd();

// Loader assoluto corretto
const R = (p) => require(path.join(ROOT, "app", p));

/* =========================================================
   REQUIRE ASSOLUTI
========================================================= */
const db = R("server/db/database.cjs");
const jsonGen = R("server/modules/generatore-json.cjs");
const catalogo = R("modules/catalogo-sql.cjs");

/* =========================================================
   1) LISTA PRODOTTI DA CREARE
========================================================= */
async function getprodottidacreare(req) {
  console.log("[ADMIN AI] getprodottidacreare()");

  try {
    const rows = db.prepare(`
      SELECT *
      FROM prodotti_da_creare
      ORDER BY id DESC
      LIMIT 500
    `).all();

    return { success: true, data: rows };

  } catch (err) {
    console.error("❌ getprodottidacreare ERROR:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   2) APPROVA E PUBBLICA PRODOTTO
   PATCH 2027.2:
   - gestione config_json sicura
   - prezzo consigliato
   - campi competitor
   - descrizione breve auto
   - validazioni
   - fix crash catalogo
========================================================= */
async function approvaprodotto(req) {
  console.log("[ADMIN AI] approvaprodotto()");

  try {
    const { id } = req.body || {};
    if (!id) return { success: false, error: "id mancante" };

    const p = db.prepare(`
      SELECT *
      FROM prodotti_da_creare
      WHERE id = ?
      LIMIT 1
    `).get(id);

    if (!p) return { success: false, error: "Prodotto da creare non trovato" };

    /* ---------------------------------------------------------
       CONFIG JSON (safe parse)
    --------------------------------------------------------- */
    let config = {};
    try {
      config = JSON.parse(p.config_json || "{}");
    } catch (err) {
      console.warn("⚠️ config_json corrotto → fallback {}");
      config = {};
    }

    const prezzoConsigliato = config.prezzo_consigliato || p.prezzo_cent;
    const configSuggerita = config.suggerita || null;

    /* ---------------------------------------------------------
       DESCRIZIONE BREVE (safe)
    --------------------------------------------------------- */
    let descrizioneBreve = "";
    if (p.descrizione_tecnica && typeof p.descrizione_tecnica === "string") {
      descrizioneBreve =
        p.descrizione_tecnica.split(".")[0].slice(0, 180).trim() + "...";
    }

    /* ---------------------------------------------------------
       COSTRUZIONE PRODOTTO FINALE
    --------------------------------------------------------- */
    const dataProd = {
      titolo: p.titolo || "Prodotto senza titolo",
      descrizione_lunga: p.descrizione_tecnica || "",
      descrizione_breve: descrizioneBreve,

      prezzo_cent: prezzoConsigliato,

      immagine: p.immagine_url || null,
      file_consegna_url: p.file_consegna_url || null,
      categoria: p.categoria || null,

      config_json: p.config_json || null,

      percentuale_competitor: p.percentuale_competitor || null,
      punteggio_saturazione: p.punteggio_saturazione || null,
      punteggio_opportunita: p.punteggio_opportunita || null,
      configurazione_consigliata: configSuggerita
    };

    /* ---------------------------------------------------------
       SALVATAGGIO NEL CATALOGO (safe)
    --------------------------------------------------------- */
    let prodottoFinale = null;
    try {
      prodottoFinale = catalogo.saveProduct(dataProd);
    } catch (err) {
      console.error("❌ ERRORE catalogo.saveProduct:", err);
      return {
        success: false,
        error: "Errore salvataggio prodotto nel catalogo"
      };
    }

    /* ---------------------------------------------------------
       MARCA COME PUBBLICATO
    --------------------------------------------------------- */
    db.prepare(`
      UPDATE prodotti_da_creare
      SET stato = 'pubblicato',
          aggiornato_il = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    /* ---------------------------------------------------------
       RIGENERA JSON MIRROR
    --------------------------------------------------------- */
    try {
      await jsonGen.exportProducts();
      await jsonGen.exportCategories();
      await jsonGen.exportCatalog();
      await jsonGen.exportProdottiDaCreare();
    } catch (err) {
      console.error("⚠️ ERRORE export JSON mirror:", err);
    }

    return {
      success: true,
      data: {
        prodotto: prodottoFinale,
        prodotto_da_creare: p
      }
    };

  } catch (err) {
    console.error("❌ approvaprodotto ERROR:", err);
    return { success: false, error: "Errore server approvazione" };
  }
}

/* =========================================================
   3) ELIMINA PRODOTTO DA CREARE
========================================================= */
async function eliminaprodottodacreare(req) {
  console.log("[ADMIN AI] eliminaprodottodacreare()", req.params);

  try {
    const id = req.params.id;
    if (!id) return { success: false, error: "id mancante" };

    db.prepare(`
      DELETE FROM prodotti_da_creare
      WHERE id = ?
    `).run(id);

    try {
      await jsonGen.exportProdottiDaCreare();
    } catch (err) {
      console.error("⚠️ ERRORE exportProdottiDaCreare:", err);
    }

    return { success: true };

  } catch (err) {
    console.error("❌ eliminaprodottodacreare ERROR:", err);
    return { success: false, error: "Errore server" };
  }
}

module.exports = {
  getprodottidacreare,
  approvaprodotto,
  eliminaprodottodacreare
};
