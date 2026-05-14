CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT,
  name TEXT,
  avatar TEXT,
  bot TEXT,
  last_message TEXT,
  lim_state TEXT,
  updated_at INTEGER
);
