/* CREA TABELLA SE NON ESISTE */
db.prepare(`
  CREATE TABLE IF NOT EXISTS game_state (
    uid TEXT PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    bot TEXT,
    last_message TEXT,
    lim_state TEXT,
    updated_at INTEGER
  )
`).run();
