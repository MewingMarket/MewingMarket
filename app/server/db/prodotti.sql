CREATE TABLE IF NOT EXISTS prodotti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Titolo completo (inserito nel form)
  titolo TEXT NOT NULL,

  -- Titolo breve (generato automaticamente)
  titolo_breve TEXT,

  -- Prezzo in centesimi (es. 990 = 9,90€)
  prezzo_cent INTEGER NOT NULL,

  -- Descrizione breve (generata automaticamente)
  descrizione_breve TEXT,

  -- Descrizione lunga (inserita nel form)
  descrizione_lunga TEXT,

  -- Categoria automatica (generata da titolo + descrizione)
  categoria TEXT,

  -- Campi YouTube (aggiornati automaticamente da youtube.cjs)
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
