CREATE TABLE IF NOT EXISTS prodotti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Titolo completo (quello che inserisci nel form)
  titolo TEXT NOT NULL,

  -- Titolo breve (generato automaticamente dal backend)
  titolo_breve TEXT,

  -- Prezzo in centesimi (es. 990 = 9,90€)
  prezzo_cent INTEGER NOT NULL,

  -- Descrizione breve (generata automaticamente dal backend)
  descrizione_breve TEXT,

  -- Descrizione lunga (quella che inserisci nel form)
  descrizione_lunga TEXT,

  -- Campi YouTube (aggiornati in automatico da youtube.cjs)
  youtube_url TEXT,
  youtube_title TEXT,
  youtube_thumbnail TEXT,
  youtube_description TEXT,
  youtube_video_id TEXT,

  -- Immagine e file consegna
  immagine_url TEXT,
  file_consegna_url TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
