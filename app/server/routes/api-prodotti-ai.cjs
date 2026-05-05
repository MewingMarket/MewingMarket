/* =========================================================
   AI PRODOTTI — Versione 2026.300
   - searchproduct  → salva in validazioni
   - generateproduct → salva in prodotti_da_creare
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");

// Moduli AI (stub o reali)
const { generaDescrizioneTecnica } = R("modules/catalogo-ai.cjs");

/* =========================================================
   1) SEARCH PRODUCT (trend + analisi)
========================================================= */
async function searchproduct(req) {
  console.log("[AI] searchproduct()");

  try {
    const { query } = req.body || {};
    if (!query) {
      return { success: false, error: "Query mancante" };
    }

    // Stub AI — sostituibile con ricerca reale
    const result = {
      titolo: query.trim(),
      categoria: "Generico",
      trend_score: 0.72,
      colore: "giallo",
      motivazione: "Buon potenziale ma concorrenza elevata",
      note_ricerca: "Analisi preliminare generata automaticamente"
    };

    const stmt = db.prepare(`
      INSERT INTO validazioni (
        titolo, query_ricerca, note_ricerca,
        categoria, colore, motivazione, trend_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      result.titolo,
      query,
      result.note_ricerca,
      result.category,
      result.colore,
      result.motivazione,
      result.trend_score
    );

    await jsonGen.exportValidazioni();

    return {
      success: true,
      data: {
        id: info.lastInsertRowid,
        ...result
      }
    };

  } catch (err) {
    console.error("❌ searchproduct ERROR:", err);
    return { success: false, error: "Errore server AI search" };
  }
}

/* =========================================================
   2) GENERATE PRODUCT (descrizione tecnica + scheda)
========================================================= */
async function generateproduct(req) {
  console.log("[AI] generateproduct()");

  try {
    const { validazione_id } = req.body || {};
    if (!validazione_id) {
      return { success: false, error: "validazione_id mancante" };
    }

    const val = db.prepare(`
      SELECT *
      FROM validazioni
      WHERE id = ?
      LIMIT 1
    `).get(validazione_id);

    if (!val) {
      return { success: false, error: "Validazione non trovata" };
    }

    // Generazione descrizione tecnica
    const descrizione_tecnica = await generaDescrizioneTecnica({
      titolo: val.titolo,
      categoria: val.categoria,
      note: val.note_ricerca
    });

    const prezzo_cent = 4900; // default 49€

    const stmt = db.prepare(`
      INSERT INTO prodotti_da_creare (
        validazione_id,
        titolo,
        categoria,
        prezzo_cent,
        descrizione_tecnica,
        stato
      ) VALUES (?, ?, ?, ?, ?, 'generato')
    `);

    const info = stmt.run(
      val.id,
      val.titolo,
      val.categoria || "",
      prezzo_cent,
      descrizione_tecnica
    );

    await jsonGen.exportProdottiDaCreare();

    return {
      success: true,
      data: {
        id: info.lastInsertRowid,
        validazione_id: val.id,
        titolo: val.titolo,
        categoria: val.categoria,
        prezzo_cent,
        descrizione_tecnica
      }
    };

  } catch (err) {
    console.error("❌ generateproduct ERROR:", err);
    return { success: false, error: "Errore server AI generate" };
  }
}

module.exports = {
  searchproduct,
  generateproduct
};
