/* =========================================================
   File: app/server/db/feedback.sql
   Tabella recensioni utenti — Versione SQL definitiva
   Compatibile con api-feedback.cjs
========================================================= */

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utente_id INTEGER NOT NULL,
  prodotto_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  commento TEXT NOT NULL,
  data TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (utente_id) REFERENCES utenti(id),
  FOREIGN KEY (prodotto_id) REFERENCES prodotti(id)
);
