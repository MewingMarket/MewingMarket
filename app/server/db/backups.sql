/* FILE: app/server/db/backups.sql
 * Tabella log backup — persistente + mirror JSON
 */

CREATE TABLE IF NOT EXISTS backups_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  source TEXT NOT NULL,          -- es: 'startup', 'daily', 'auto-5m', 'manual'
  hash TEXT,                     -- hash MD5 del DB
  size_bytes INTEGER,            -- dimensione ZIP
  filename TEXT                  -- nome file ZIP
);
