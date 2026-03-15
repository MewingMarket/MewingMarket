DROP TABLE IF EXISTS prodotti;

CREATE TABLE prodotti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titolo TEXT NOT NULL,
  titolo_breve TEXT,
  descrizione_lunga TEXT,
  descrizione_breve TEXT,
  prezzo_cent INTEGER NOT NULL,
  categoria TEXT,
  immagine_url TEXT,
  file_consegna_url TEXT,
  youtube_url TEXT,
  youtube_video_id TEXT,
  youtube_title TEXT,
  youtube_description TEXT,
  youtube_thumbnail TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
