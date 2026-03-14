CREATE TABLE IF NOT EXISTS vendite (
  

  uid TEXT,
  prodotto_id INTEGER,
  prezzo_cent INTEGER NOT NULL,
  origine TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  referrer TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (prodotto_id) REFERENCES prodotti(id)
);
