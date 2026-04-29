/* =========================================================
   FILE: app/server/routes/admin-feedback.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Feedback Admin — Lista + KPI + Debug DB
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");

/* =========================================================
   FUNZIONE: adminFeedbackLista
   (ex GET /admin/feedback/lista)
========================================================= */
async function adminFeedbackLista(req) {
  console.log("[DEBUG adminFeedback] chiamato adminFeedbackLista()");

  try {
    const lista = db.prepare(`
      SELECT f.id, f.rating, f.commento, f.data,
             f.prodotto_id, f.utente_id,
             p.titolo_breve AS prodotto_titolo,
             u.email AS utente_email
      FROM feedback f
      LEFT JOIN utenti u ON u.id = f.utente_id
      LEFT JOIN prodotti p ON p.id = f.prodotto_id
      ORDER BY f.id DESC
    `).all();

    const ordini = db.prepare(`
      SELECT id, utente_id, prodotti_json
      FROM ordini
    `).all();

    const output = lista.map(f => {
      if (f.utente_email) return f;

      for (const o of ordini) {
        try {
          const prodotti = JSON.parse(o.prodotti_json);
          const match = prodotti.find(p => p.prodotto_id === f.prodotto_id);
          if (match) {
            const u = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(o.utente_id);
            if (u?.email) return { ...f, utente_email: u.email };
          }
        } catch {}
      }

      return { ...f, utente_email: "Anonimo" };
    });

    const kpi = {
      totale: output.length,
      media_stelle: output.length
        ? (output.reduce((s, f) => s + Number(f.rating), 0) / output.length).toFixed(2)
        : 0,
      percentuali: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      prodotti_top: [],
      prodotti_flop: []
    };

    output.forEach(f => {
      const r = Number(f.rating);
      if (kpi.percentuali[r] !== undefined) kpi.percentuali[r]++;
    });

    Object.keys(kpi.percentuali).forEach(k => {
      kpi.percentuali[k] = output.length
        ? ((kpi.percentuali[k] / output.length) * 100).toFixed(1)
        : 0;
    });

    const mapProdotti = {};
    output.forEach(f => {
      if (!mapProdotti[f.prodotto_id]) {
        mapProdotti[f.prodotto_id] = {
          prodotto_id: f.prodotto_id,
          titolo: f.prodotto_titolo,
          count: 0,
          somma: 0
        };
      }
      mapProdotti[f.prodotto_id].count++;
      mapProdotti[f.prodotto_id].somma += Number(f.rating);
    });

    const arr = Object.values(mapProdotti).map(p => ({
      ...p,
      media: (p.somma / p.count).toFixed(2)
    }));

    kpi.prodotti_top = arr.sort((a, b) => b.media - a.media).slice(0, 5);
    kpi.prodotti_flop = arr.sort((a, b) => a.media - b.media).slice(0, 5);

    return { success: true, feedback: output, kpi };

  } catch (err) {
    console.error("❌ Errore adminFeedbackLista:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   FUNZIONE: adminFeedbackDebugDB
   (ex GET /admin/feedback/debug-db)
========================================================= */
async function adminFeedbackDebugDB(req) {
  console.log("[DEBUG adminFeedback] chiamato adminFeedbackDebugDB()");

  try {
    return {
      success: true,
      feedback: db.prepare(`SELECT * FROM feedback`).all(),
      ordini: db.prepare(`SELECT * FROM ordini`).all(),
      prodotti: db.prepare(`SELECT * FROM prodotti`).all(),
      utenti: db.prepare(`SELECT * FROM utenti`).all()
    };
  } catch (err) {
    console.error("❌ Errore adminFeedbackDebugDB:", err);
    return { success: false, error: "Errore debug-db" };
  }
}

/* =========================================================
   ALIAS INTELLIGENTI — compatibilità frontend
   (il frontend chiama ancora i vecchi path)
========================================================= */

async function lista(req) {
  console.log("[DEBUG adminFeedback] alias lista() → adminFeedbackLista()");
  return adminFeedbackLista(req);
}

async function debugDB(req) {
  console.log("[DEBUG adminFeedback] alias debugDB() → adminFeedbackDebugDB()");
  return adminFeedbackDebugDB(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  adminFeedbackLista,
  adminFeedbackDebugDB,

  // alias compatibilità
  lista,
  debugDB
};
