/* =========================================================
   ADMIN PRODOTTI AI — Versione 2026.300
   - getprodottidacreare
   - approvaprodotto
   - eliminaprodottodacreare
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");
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

    // Conversione in prodotto catalogo
    const dataProd = {
      titolo: p.titolo,
      descrizione_lunga: p.descrizione_tecnica,   // generiamo breve/lunga dopo
      descrizione_breve: "",
      prezzo_cent: p.prezzo_cent,
      immagine: p.immagine_url || null,
      categoria: p.categoria || null
    };

    const prodottoFinale = catalogo.saveProduct(dataProd);

    db.prepare(`
      UPDATE prodotti_da_creare
      SET stato = 'pubblicato',
          aggiornato_il = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

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
