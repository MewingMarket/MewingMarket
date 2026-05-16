CREATE TABLE IF NOT EXISTS missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT,
  mission_key TEXT,
  status TEXT, -- active | completed | claimed
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,
  reward_xp INTEGER DEFAULT 10,
  created_at INTEGER,
  updated_at INTEGER
);
