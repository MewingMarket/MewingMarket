-- =========================================================
-- PATCH SQL — Aggiunta colonna download_token a ordini
-- Versione: 2026.92 (IDEMPOTENTE)
-- =========================================================

-- Controlla se la colonna esiste già
SELECT 1
FROM pragma_table_info('ordini')
WHERE name = 'download_token';

-- Se la SELECT sopra NON restituisce righe → esegui la patch

PRAGMA foreign_keys = off;

BEGIN TRANSACTION;

-- Crea una nuova tabella con la colonna aggiuntiva
CREATE TABLE IF NOT EXISTS ordini_new AS
SELECT *,
       NULL AS download_token
FROM ordini;

-- Rimuovi la tabella originale
DROP TABLE ordini;

-- Rinomina la nuova tabella
ALTER TABLE ordini_new RENAME TO ordini;

COMMIT;

PRAGMA foreign_keys = on;
