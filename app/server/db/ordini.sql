CREATE TABLE IF NOT EXISTS ordini (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  utente_id INTEGER NOT NULL,

  prodotti_json TEXT NOT NULL,
  -- [
  --   {"prodotto_id": 12, "titolo": "Ebook 1", "quantita": 1, "prezzo_cent": 990},
  --   {"prodotto_id": 15, "titolo": "Ebook 2", "quantita": 1, "prezzo_cent": 1490}
  -- ]

  totale_cent INTEGER NOT NULL,

  stato TEXT NOT NULL,                 -- pagato / annullato / rimborsato
  metodo_pagamento TEXT,
  paypal_transaction_id TEXT,

  data_ordine TEXT DEFAULT CURRENT_TIMESTAMP,

  download_token TEXT,

  FOREIGN KEY (utente_id) REFERENCES utenti(id)
);
