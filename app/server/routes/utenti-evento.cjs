/* =========================================================
   FILE: app/server/routes/utenti-evento.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Log evento utente → risposta immediata
========================================================= */

async function evento(req) {
  return {
    success: true,
    evento: req.body || null,
    timestamp: new Date().toISOString()
  };
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
