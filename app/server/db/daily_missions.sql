CREATE TABLE IF NOT EXISTS daily_missions (
  uid TEXT,
  mission_key TEXT,
  date TEXT,
  completed INTEGER DEFAULT 0,
  PRIMARY KEY(uid, mission_key, date)
);
