/* =========================================================
   FILE: app/server/routes/api-feedback.cjs
   VERSIONE: 2027.3 — PATCH STABILE
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Sistema recensioni utenti — SQL definitivo
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const { inviaEmailFeedback } = R("modules/email-feedback.cjs");

/* =========================================================
   UTILS
========================================================= */
function safeParse(str) {
  try { return JSON.parse(str); }
  catch { return []; }
}

function safe(v, fallback = "") {
  return v === undefined || v === null ? fallback : v;
}

/* =========================================================
   1) prodottiAcquistati
========================================================= */
async function prodottiAcquistati(req) {
  console.log("[DEBUG feedback] prodottiAcquistati()");

  try {
    const userId = req.user?.id;
    if (!userId) return { success: false, error: "Utente non autenticato" };

    const stmt = db.prepare(`
      SELECT DISTINCT p.id, p.titolo_breve
      FROM ordini o,
           json_each(o.prodotti_json) AS je
      JOIN prodotti p
           ON p.id = CAST(json_extract(je.value, '$.prodotto_id') AS INTEGER)
      WHERE o.utente_id = ?
    `);

    const prodotti = stmt.all(userId);

    return { success: true, prodotti };

  } catch (err) {
    console.error("❌ Errore prodottiAcquistati:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   2) recensioniUtente
========================================================= */
async function recensioniUtente(req) {
  console.log("[DEBUG feedback] recensioniUtente()");

  try {
    const userId = req.user?.id;
    if (!userId) return { success: false, error: "Utente non autenticato" };

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
      WHERE f.utente_id = ?
      ORDER BY f.id DESC
    `);

    const recensioni = stmt.all(userId);

    return { success: true, recensioni };

  } catch (err) {
    console.error("❌ Errore recensioniUtente:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   3) creaRecensione
========================================================= */
async function creaRecensione(req) {
  console.log("[DEBUG feedback] creaRecensione()");

  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId) return { success: false, error: "Utente non autenticato" };

    const { prodotto_id, rating, commento } = req.body || {};

    if (!prodotto_id || !rating || !commento) {
      return { success: false, error: "Dati mancanti" };
    }

    if (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return { success: false, error: "Rating non valido" };
    }

    if (String(commento).length > 1000) {
      return { success: false, error: "Commento troppo lungo" };
    }

    /* ---------------------------------------------------------
       Parole vietate (case-insensitive)
    --------------------------------------------------------- */
    const paroleVietate = [
      "cazzo", "merda", "stronzo", "troia", "puttana", "vaffanculo",
      "bastardo", "cretino", "deficiente", "idiota"
    ];

    const lower = commento.toLowerCase();
    if (paroleVietate.some(p => lower.includes(p))) {
      return { success: false, error: "Linguaggio non consentito" };
    }

    /* ---------------------------------------------------------
       Verifica acquisto
    --------------------------------------------------------- */
    const ordini = db.prepare(`
      SELECT prodotti_json
      FROM ordini
      WHERE utente_id = ?
    `).all(userId);

    let haAcquistato = false;

    for (const o of ordini) {
      const prodotti = safeParse(o.prodotti_json);
      if (prodotti.some(p => Number(p.prodotto_id) === Number(prodotto_id))) {
        haAcquistato = true;
        break;
      }
    }

    if (!haAcquistato) {
      return { success: false, error: "Non hai acquistato questo prodotto" };
    }

    /* ---------------------------------------------------------
       Blocco doppie recensioni
    --------------------------------------------------------- */
    const esiste = db.prepare(`
      SELECT id FROM feedback
      WHERE utente_id = ? AND prodotto_id = ?
    `).get(userId, prodotto_id);

    if (esiste) {
      return { success: false, error: "Hai già recensito questo prodotto" };
    }

    /* ---------------------------------------------------------
       Inserimento recensione
    --------------------------------------------------------- */
    db.prepare(`
      INSERT INTO feedback (
        utente_id,
        prodotto_id,
        rating,
        commento,
        data
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(userId, prodotto_id, Number(rating), commento);

    /* ---------------------------------------------------------
       Email ringraziamento (non blocca)
    --------------------------------------------------------- */
    try {
      inviaEmailFeedback({
        email: userEmail,
        prodotto_id,
        rating,
        commento
      });
    } catch (err) {
      console.error("❌ Errore invio email feedback:", err);
    }

    return { success: true };

  } catch (err) {
    console.error("❌ Errore creaRecensione:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   4) modificaRecensione
========================================================= */
async function modificaRecensione(req) {
  console.log("[DEBUG feedback] modificaRecensione()");

  try {
    const userId = req.user?.id;
    const { id, rating, commento } = req.body || {};

    if (!userId) return { success: false, error: "Utente non autenticato" };

    const rec = db.prepare(`
      SELECT utente_id
      FROM feedback
      WHERE id = ?
    `).get(id);

    if (!rec) return { success: false, error: "Recensione non trovata" };
    if (rec.utente_id !== userId) return { success: false, error: "Non autorizzato" };

    db.prepare(`
      UPDATE feedback
      SET rating = ?, commento = ?, data = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(Number(rating), commento, id);

    return { success: true };

  } catch (err) {
    console.error("❌ Errore modificaRecensione:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   5) eliminaRecensione
========================================================= */
async function eliminaRecensione(req) {
  console.log("[DEBUG feedback] eliminaRecensione()");

  try {
    const userId = req.user?.id;
    const { id } = req.body || {};

    if (!userId) return { success: false, error: "Utente non autenticato" };

    const rec = db.prepare(`
      SELECT utente_id
      FROM feedback
      WHERE id = ?
    `).get(id);

    if (!rec) return { success: false, error: "Recensione non trovata" };
    if (rec.utente_id !== userId) return { success: false, error: "Non autorizzato" };

    db.prepare(`DELETE FROM feedback WHERE id = ?`).run(id);

    return { success: true };

  } catch (err) {
    console.error("❌ Errore eliminaRecensione:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function getProdottiAcquistati(req) { return prodottiAcquistati(req); }
async function getRecensioniUtente(req) { return recensioniUtente(req); }

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  prodottiAcquistati,
  recensioniUtente,
  creaRecensione,
  modificaRecensione,
  eliminaRecensione,

  // alias compatibilità
  getProdottiAcquistati,
  getRecensioniUtente
};
