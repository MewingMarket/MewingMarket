/* =========================================================
   FILE: app/server/routes/api-recensioni-top.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Top recensioni globali — Versione definitiva
   ORIGINALE: ex GET /recensioni/top
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");

/* =========================================================
   FUNZIONE: recensioniTop
   (ex GET /recensioni/top)
========================================================= */
async function recensioniTop(req) {
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
   EXPORT — stile Java
========================================================= */
module.exports = {
  recensioniTop
};
