CREATE TABLE IF NOT EXISTS prodotti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titolo TEXT NOT NULL,
  descrizione_lunga TEXT,
  descrizione_breve TEXT,
  prezzo REAL NOT NULL,
  immagine TEXT,
  fileProdotto TEXT,
  categoria TEXT,
  youtube_url TEXT,
  youtube_video_id TEXT,
  youtube_title TEXT,
  youtube_description TEXT,
  youtube_thumbnail TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
