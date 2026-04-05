CREATE TABLE IF NOT EXISTS kpi_settimanali (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settimana TEXT NOT NULL, -- formato YYYY-WW
  vendite INTEGER DEFAULT 0,
  nuovi_utenti INTEGER DEFAULT 0,
  feedback INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0
);
