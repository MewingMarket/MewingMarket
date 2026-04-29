/* =========================================================
   FILE: app/server/routes/api-recensioni-top.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Top recensioni globali — Versione definitiva
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");

/* =========================================================
   FUNZIONE PRINCIPALE: recensioniTop
   (ex GET /recensioni/top)
========================================================= */
async function recensioniTop(req) {
  console.log("[DEBUG recensioni-top] recensioniTop() chiamato");

  try {
    const stmt = db.prepare(`
      SELECT 
        f.id,
        f.prodotto_id,
        f.rating,
        f.commento,
        f.data,
        p.titolo_breve AS prodotto_titolo
      FROM feedback f
      LEFT JOIN prodotti p ON p.id = f.prodotto_id
      WHERE f.rating >= 4
        AND LENGTH(f.commento) > 0
      ORDER BY f.id DESC
      LIMIT 10
    `);

    const top = stmt.all();

    return { success: true, top };

  } catch (err) {
    console.error("❌ Errore recensioniTop:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (vecchi endpoint ancora usati)
========================================================= */

async function getTopRecensioni(req) {
  console.log("[DEBUG recensioni-top] alias getTopRecensioni() → recensioniTop()");
  return recensioniTop(req);
}

async function recensioniTopAlias(req) {
  console.log("[DEBUG recensioni-top] alias recensioniTopAlias() → recensioniTop()");
  return recensioniTop(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  recensioniTop,

  // alias compatibilità
  getTopRecensioni,
  recensioniTopAlias
};
