CREATE TABLE IF NOT EXISTS utenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  ruolo TEXT DEFAULT 'user',
  sessione TEXT,
  reset_password_token TEXT,
  reset_email_token TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
