CREATE TABLE IF NOT EXISTS validazioni (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  titolo            TEXT NOT NULL,
  query_ricerca     TEXT,
  note_ricerca      TEXT,
  categoria         TEXT,
  colore            TEXT,          -- 'verde' | 'giallo' | 'rosso'
  motivazione       TEXT,
  trend_score       REAL,          -- 0–1 o 0–100
  concorrenza_note  TEXT,
  creato_il         DATETIME DEFAULT CURRENT_TIMESTAMP
);
