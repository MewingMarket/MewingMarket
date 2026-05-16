// FILE: app/server/routes/admin-prodotti-ai.cjs
// PATH ASSOLUTO: app/server/routes/admin-prodotti-ai.cjs
// VERSIONE PATCH: Competitor Intelligence 2027.1

/* =========================================================
   ADMIN PRODOTTI AI — Versione 2027.1
   - getprodottidacreare
   - approvaprodotto (con immagine + file + competitor intelligence)
   - eliminaprodottodacreare
========================================================= */

const path = require("path");
const ROOT = process.cwd();

// Loader assoluto corretto → punta a app/
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
   🔥 PATCH: integra campi competitor + prezzo consigliato
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
       RECUPERO CONFIG + COMPETITOR (se presenti)
    --------------------------------------------------------- */
    let config = {};
    try {
      config = JSON.parse(p.config_json || "{}");
    } catch {
      config = {};
    }

    const prezzoConsigliato = config.prezzo_consigliato || p.prezzo_cent;
    const configSuggerita = config.suggerita || null;

    /* ---------------------------------------------------------
       GENERA DESCRIZIONE BREVE AUTOMATICA
    --------------------------------------------------------- */
    const descrizioneBreve = p.descrizione_tecnica
      ? p.descrizione_tecnica.split(".")[0].slice(0, 180) + "..."
      : "";

    /* ---------------------------------------------------------
       COSTRUZIONE PRODOTTO FINALE (PATCH)
       🔥 Inseriamo:
       - prezzo consigliato
       - configurazione consigliata
       - campi competitor (se presenti)
    --------------------------------------------------------- */
    const dataProd = {
      titolo: p.titolo,
      descrizione_lunga: p.descrizione_tecnica,
      descrizione_breve: descrizioneBreve,

      // 🔥 prezzo consigliato
      prezzo_cent: prezzoConsigliato,

      immagine: p.immagine_url || null,
      file_consegna_url: p.file_consegna_url || null,
      categoria: p.categoria || null,

      // 🔥 config consigliata
      config_json: p.config_json || null,

      // 🔥 campi competitor (se presenti)
      percentuale_competitor: p.percentuale_competitor || null,
      punteggio_saturazione: p.punteggio_saturazione || null,
      punteggio_opportunita: p.punteggio_opportunita || null,
      configurazione_consigliata: configSuggerita
    };

    /* ---------------------------------------------------------
       SALVATAGGIO NEL CATALOGO
    --------------------------------------------------------- */
    const prodottoFinale = catalogo.saveProduct(dataProd);

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
    await jsonGen.exportProducts();
    await jsonGen.exportCategories();
    await jsonGen.exportCatalog();
    await jsonGen.exportProdottiDaCreare();

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

    await jsonGen.exportProdottiDaCreare();

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
