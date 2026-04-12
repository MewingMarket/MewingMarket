CREATE TABLE IF NOT EXISTS rimborsi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordine_id INTEGER NOT NULL,
  utente_id INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  stato TEXT DEFAULT 'in_attesa',
  data_richiesta TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ordine_id) REFERENCES ordini(id),
  FOREIGN KEY (utente_id) REFERENCES utenti(id)
);
