CREATE TABLE IF NOT EXISTS prodotti_da_creare (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  validazione_id    INTEGER,                 -- collegamento soft alla tabella validazioni

  titolo            TEXT NOT NULL,
  categoria         TEXT,
  prezzo_cent       INTEGER,

  descrizione_tecnica TEXT,                  -- unica descrizione generata in fase AI
                                             -- (poi da questa generiamo breve + lunga nel catalogo)

  immagine_url      TEXT,
  pdf_url           TEXT,
  info_json         TEXT,                    -- JSON string (es. {durata, moduli, ecc.})

  stato             TEXT DEFAULT 'bozza',    -- 'bozza' | 'generato' | 'pronto' | 'pubblicato'
  note_admin        TEXT,

  creato_il         DATETIME DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il     DATETIME DEFAULT CURRENT_TIMESTAMP
);
