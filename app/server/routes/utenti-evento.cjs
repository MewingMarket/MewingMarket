/* =========================================================
   FILE: app/server/routes/utenti-evento.cjs
   VERSIONE: 2027.3 — PATCH STABILE
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Log evento utente → salva su SQL + risposta immediata
========================================================= */

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

/* =========================================================
   FUNZIONE PRINCIPALE: evento
========================================================= */
async function evento(req) {
  try {
    const body = req.body || {};
    const email = body.email || req.user?.email || null;
    const evento = body.evento || body.type || "evento_sconosciuto";
    const note = body.note || null;

    // IP e User-Agent (se disponibili)
    const ip = req.headers["x-forwarded-for"] || req.ip || null;
    const userAgent = req.headers["user-agent"] || null;

    if (!email) {
      return {
        success: false,
        error: "Email mancante per registrare evento"
      };
    }

    // Salvataggio SQL
    try {
      db.prepare(`
        INSERT INTO utenti_eventi (email, evento, ip, user_agent, note)
        VALUES (?, ?, ?, ?, ?)
      `).run(email, evento, ip, userAgent, note);
    } catch (err) {
      console.error("❌ Errore salvataggio utenti_eventi:", err);
    }

    return {
      success: true,
      email,
      evento,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.error("❌ Errore evento():", err);
    return {
      success: false,
      error: "Errore interno registrazione evento"
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function log(req) {
  return evento(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  evento,
  log
};
