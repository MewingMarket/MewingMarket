/* =========================================================
   File: app/server/db/utenti_eventi.sql
   Tabella eventi utente — Versione 2026.1
   Usata per tracciare eventi base per ogni utente
========================================================= */

CREATE TABLE IF NOT EXISTS utenti_eventi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  evento TEXT NOT NULL,              -- "registrato" | "login" | "eliminato" | "bloccato" | "sbloccato" | "logout" (se in futuro)
  ip TEXT,                           -- opzionale (non usato ora)
  user_agent TEXT,                   -- opzionale (non usato ora)
  note TEXT,                         -- opzionale
  data TEXT DEFAULT CURRENT_TIMESTAMP
);
