/* =========================================================
   FILE: app/server/routes/rimborso.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Rimborsi — Utente + Admin (intelligente)
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const { inviaEmailRimborso } = R("modules/email-rimborso.cjs");
const jsonGen = R("modules/generatore-json.cjs");

const categorieRimborso = R("modules/rimborso-categorie.cjs");
const { generaRispostaRimborso } = R("modules/genera-risposta-rimborso.cjs");

/* =========================================================
   FUNZIONE 1 — creaRimborso (UTENTE)
========================================================= */
async function creaRimborso(req) {
  console.log("[DEBUG rimborso] creaRimborso()");

  try {
    const userId = req.user.id;
    const { ordine_id, motivo } = req.body;

    if (!ordine_id || !motivo) {
      return { success: false, error: "Campi mancanti." };
    }

    const ordine = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `).get(ordine_id, userId);

    if (!ordine) {
      return { success: false, error: "Ordine non trovato." };
    }

    if (ordine.stato !== "completato") {
      return {
        success: false,
        error: "Puoi richiedere rimborso solo per ordini completati."
      };
    }

    // 🔥 RICONOSCIMENTO CATEGORIA
    const motivoLower = motivo.toLowerCase();

    let categoriaRecord =
      categorieRimborso.find(c =>
        c.keywords.some(k => motivoLower.includes(k.toLowerCase()))
      ) ||
      categorieRimborso.find(c => c.categoria === "altro");

    const tipo = categoriaRecord.tipo;

    // CASO 1 — RISOLVIBILE → email → NON crea ticket
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

    // CASO 2 — NON RISOLVIBILE → crea ticket
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
   FUNZIONE 2 — approvaRimborso (ADMIN)
========================================================= */
async function approvaRimborso(req) {
  console.log("[DEBUG rimborso] approvaRimborso()");

  try {
    const rimborsoId = req.params.id;

    const r = db.prepare(`SELECT * FROM rimborsi WHERE id = ?`).get(rimborsoId);
    if (!r) return { success: false, error: "Richiesta non trovata." };

    const ordine = db.prepare(`SELECT * FROM ordini WHERE id = ?`).get(r.ordine_id);
    if (!ordine) return { success: false, error: "Ordine non trovato." };

    // Recupera email utente
    const utente = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(r.utente_id);
    const emailUtente = utente?.email || null;

    // Aggiorna ordine
    db.prepare(`
      UPDATE ordini
      SET stato = 'rimborsato',
          download_token = NULL,
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ordine.id);

    // Aggiorna rimborso
    db.prepare(`
      UPDATE rimborsi
      SET stato = 'approvato'
      WHERE id = ?
    `).run(rimborsoId);

    // Email approvazione
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
   FUNZIONE 3 — rifiutaRimborso (ADMIN)
========================================================= */
async function rifiutaRimborso(req) {
  console.log("[DEBUG rimborso] rifiutaRimborso()");

  try {
    const rimborsoId = req.params.id;

    const r = db.prepare(`SELECT * FROM rimborsi WHERE id = ?`).get(rimborsoId);
    if (!r) return { success: false, error: "Richiesta non trovata." };

    // Recupera email utente
    const utente = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(r.utente_id);
    const emailUtente = utente?.email || null;

    // Riconoscimento categoria per email rifiuto
    const motivoLower = r.motivo.toLowerCase();

    let categoriaRecord =
      categorieRimborso.find(c =>
        c.keywords.some(k => motivoLower.includes(k.toLowerCase()))
      ) ||
      categorieRimborso.find(c => c.categoria === "altro");

    // Aggiorna stato
    db.prepare(`
      UPDATE rimborsi
      SET stato = 'rifiutato'
      WHERE id = ?
    `).run(rimborsoId);

    // Email rifiuto
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

async function crea(req) {
  console.log("[DEBUG rimborso] alias crea() → creaRimborso()");
  return creaRimborso(req);
}

async function procedi(req) {
  console.log("[DEBUG rimborso] alias procedi() → approvaRimborso()");
  return approvaRimborso(req);
}

async function rifiuta(req) {
  console.log("[DEBUG rimborso] alias rifiuta() → rifiutaRimborso()");
  return rifiutaRimborso(req);
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
  rifiuta
};
