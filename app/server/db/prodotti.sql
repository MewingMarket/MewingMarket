CREATE TABLE IF NOT EXISTS prodotti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  titolo_breve TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  prezzo_cent INTEGER NOT NULL,
  descrizione_breve TEXT,
  descrizione_lunga TEXT,

  youtube_url TEXT,
  youtube_title TEXT,
  youtube_thumbnail TEXT,
  youtube_video_id TEXT,

  immagine_url TEXT,
  file_consegna_url TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
