/* =========================================================
   File: app/server/db/newsletter_log.sql
   Tabella log newsletter — Versione SQL definitiva
   Usata SOLO per dashboard admin (non per Brevo)
========================================================= */

CREATE TABLE IF NOT EXISTS newsletter_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  azione TEXT NOT NULL,              -- "subscribe" | "unsubscribe"
  origine TEXT,                      -- "form" | "checkout" | "admin" | "auto"
  note TEXT,                         -- opzionale
  data TEXT DEFAULT CURRENT_TIMESTAMP
);
