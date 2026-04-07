-- =========================================================
-- PATCH SQL — Aggiunta colonna descrizione_email a prodotti
-- Versione: 2026.91 (IDEMPOTENTE)
-- =========================================================

-- Se la colonna esiste già → NON fare nulla
SELECT 1
FROM pragma_table_info('prodotti')
WHERE name = 'descrizione_email';

-- Se la SELECT sopra NON restituisce righe → esegui la patch
-- (SQLite non supporta IF NOT EXISTS su ADD COLUMN, quindi usiamo un blocco condizionale)

PRAGMA foreign_keys = off;

BEGIN TRANSACTION;

-- Crea una nuova tabella con la colonna aggiuntiva
CREATE TABLE IF NOT EXISTS prodotti_new AS
SELECT *,
       NULL AS descrizione_email
FROM prodotti;

-- Copia i dati esistenti (se la colonna già esiste, la SELECT precedente evita il doppio)
DROP TABLE prodotti;
ALTER TABLE prodotti_new RENAME TO prodotti;

COMMIT;

PRAGMA foreign_keys = on;
