-- =========================================================
-- PATCH SQL — Aggiunta colonna descrizione_email a prodotti
-- Versione: 2026.91
-- =========================================================

ALTER TABLE prodotti
ADD COLUMN descrizione_email TEXT;
