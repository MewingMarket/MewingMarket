/**
 * FILE: app/server/routes/rimborso.cjs
 * VERSIONE: 2027.3 — PATCH STABILE
 * MODALITÀ: Java‑mode (funzioni, no Express)
 * DESCRIZIONE: Rimborsi — Utente + Admin (intelligente)
 */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const { inviaEmailRimborso } = R("modules/email-rimborso.cjs");
const jsonGen = R("modules/generatore-json.cjs");

const categorieRimborso = R("modules/rimborso-categorie.cjs");
const { generaRispostaRimborso } = R("modules/genera-risposta-rimborso.cjs");

/* =========================================================
   UTILS
========================================================= */
function safe(v, fallback = "") {
  return v === undefined || v === null ? fallback : v;
}

/* =========================================================
   1) creaRimborso (UTENTE)
========================================================= */
async function creaRimborso(req) {
  console.log("[DEBUG rimborso] creaRimborso()");

  try {
    const userId = req.user?.id;
    const { ordine_id, motivo } = req.body || {};

    if (!userId) return { success: false, error: "Utente non autenticato." };
    if (!ordine_id || !motivo) return { success: false, error: "Campi mancanti." };

    const ordine = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `).get(ordine_id, userId);

    if (!ordine) return { success: false, error: "Ordine non trovato." };

    if (ordine.stato !== "completato") {
      return { success: false, error: "Puoi richiedere rimborso solo per ordini completati." };
    }

    /* ---------------------------------------------------------
       RICONOSCIMENTO CATEGORIA
    --------------------------------------------------------- */
    const motivoLower = motivo.toLowerCase();

    let categoriaRecord =
      categorieRimborso.find(c =>
        c.keywords.some(k => motivoLower.includes(k.toLowerCase()))
      ) ||
      categorieRimborso.find(c => c.categoria === "altro");

    const tipo = categoriaRecord.tipo;

    /* ---------------------------------------------------------
       CASO 1 — RISOLVIBILE → email → NON crea ticket
    --------------------------------------------------------- */
    if (tipo === "risolvibile") {
      await inviaEmailRimborso({
        email: req.user.email,
        tipo: "risolvibile",
        motivo,
        categoriaRecord
      });

      return {
        success: true,
        message: "Problema risolvibile → email inviata → rimborso NON aperto"
      };
    }

    /* ---------------------------------------------------------
       CASO 2 — NON RISOLVIBILE → crea ticket
    --------------------------------------------------------- */
    db.prepare(`
      INSERT INTO rimborsi (ordine_id, utente_id, motivo, stato)
      VALUES (?, ?, ?, 'in_attesa')
    `).run(ordine_id, userId, motivo);

    await inviaEmailRimborso({
      email: req.user.email,
      tipo: "non_risolvibile",
      motivo,
      categoriaRecord
    });

    return { success: true };

  } catch (err) {
    console.error("❌ Errore creaRimborso:", err);
    return { success: false, error: "Errore interno." };
  }
}

/* =========================================================
   2) approvaRimborso (ADMIN)
========================================================= */
async function approvaRimborso(req) {
  console.log("[DEBUG rimborso] approvaRimborso()");

  try {
    const rimborsoId = req.params?.id;
    if (!rimborsoId || isNaN(Number(rimborsoId))) {
      return { success: false, error: "ID non valido." };
    }

    const r = db.prepare(`SELECT * FROM rimborsi WHERE id = ?`).get(rimborsoId);
    if (!r) return { success: false, error: "Richiesta non trovata." };

    if (r.stato !== "in_attesa") {
      return { success: false, error: "Richiesta già gestita." };
    }

    const ordine = db.prepare(`SELECT * FROM ordini WHERE id = ?`).get(r.ordine_id);
    if (!ordine) return { success: false, error: "Ordine non trovato." };

    const utente = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(r.utente_id);
    const emailUtente = utente?.email || null;

    /* ---------------------------------------------------------
       AGGIORNA ORDINE
    --------------------------------------------------------- */
    db.prepare(`
      UPDATE ordini
      SET stato = 'rimborsato',
          download_token = NULL,
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ordine.id);

    /* ---------------------------------------------------------
       AGGIORNA RIMBORSO
    --------------------------------------------------------- */
    db.prepare(`
      UPDATE rimborsi
      SET stato = 'approvato'
      WHERE id = ?
    `).run(rimborsoId);

    /* ---------------------------------------------------------
       EMAIL APPROVAZIONE
    --------------------------------------------------------- */
    await inviaEmailRimborso({
      email: emailUtente,
      tipo: "approvato",
      motivo: r.motivo,
      categoriaRecord: null
    });

    try { await jsonGen.exportOrders(); } catch {}

    return { success: true };

  } catch (err) {
    console.error("❌ Errore approvaRimborso:", err);
    return { success: false, error: "Errore interno." };
  }
}

/* =========================================================
   3) rifiutaRimborso (ADMIN)
========================================================= */
async function rifiutaRimborso(req) {
  console.log("[DEBUG rimborso] rifiutaRimborso()");

  try {
    const rimborsoId = req.params?.id;
    if (!rimborsoId || isNaN(Number(rimborsoId))) {
      return { success: false, error: "ID non valido." };
    }

    const r = db.prepare(`SELECT * FROM rimborsi WHERE id = ?`).get(rimborsoId);
    if (!r) return { success: false, error: "Richiesta non trovata." };

    const utente = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(r.utente_id);
    const emailUtente = utente?.email || null;

    const motivoLower = r.motivo.toLowerCase();

    let categoriaRecord =
      categorieRimborso.find(c =>
        c.keywords.some(k => motivoLower.includes(k.toLowerCase()))
      ) ||
      categorieRimborso.find(c => c.categoria === "altro");

    db.prepare(`
      UPDATE rimborsi
      SET stato = 'rifiutato'
      WHERE id = ?
    `).run(rimborsoId);

    await inviaEmailRimborso({
      email: emailUtente,
      tipo: "rifiutato",
      motivo: r.motivo,
      categoriaRecord
    });

    return { success: true };

  } catch (err) {
    console.error("❌ Errore rifiutaRimborso:", err);
    return { success: false, error: "Errore interno." };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function crea(req) { return creaRimborso(req); }
async function procedi(req) { return approvaRimborso(req); }
async function rifiuta(req) { return rifiutaRimborso(req); }

/* =========================================================
   NUOVI ALIAS — richiesti dal frontend
========================================================= */
async function rimborso(req) {
  return { success: true, message: "Endpoint rimborso attivo" };
}

async function creaRichiesta(req) {
  return creaRimborso(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  creaRimborso,
  approvaRimborso,
  rifiutaRimborso,

  // alias compatibilità
  crea,
  procedi,
  rifiuta,

  // nuovi alias richiesti
  rimborso,
  creaRichiesta
};
