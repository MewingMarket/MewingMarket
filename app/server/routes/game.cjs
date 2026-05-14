/*
  FILE: app/server/routes/game.cjs
  DESC: Router unico per salvataggio e caricamento partita
  MODALITÀ: Java‑mode (funzioni singole, no Express)
*/

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

/* ============================================================
   SALVA PARTITA
============================================================ */
async function save(req) {
  const uid = req.uid;
  const body = req.body || {};

  const name = body.name || "";
  const avatar = body.avatar || "";
  const bot = body.bot || "";
  const lastMessage = body.lastMessage || "";
  const limState = body.limState || "";

  try {
    db.prepare(`
      INSERT INTO game_state (uid, name, avatar, bot, last_message, lim_state, updated_at)
      VALUES (@uid, @name, @avatar, @bot, @last_message, @lim_state, @updated_at)
      ON CONFLICT(uid) DO UPDATE SET
        name=@name,
        avatar=@avatar,
        bot=@bot,
        last_message=@last_message,
        lim_state=@lim_state,
        updated_at=@updated_at
    `).run({
      uid,
      name,
      avatar,
      bot,
      last_message: lastMessage,
      lim_state: limState,
      updated_at: Date.now()
    });

    return {
      success: true,
      message: "Partita salvata."
    };

  } catch (err) {
    console.error("❌ Errore salvataggio partita:", err);
    return {
      success: false,
      message: "Errore durante il salvataggio."
    };
  }
}

/* ============================================================
   CARICA PARTITA
============================================================ */
async function load(req) {
  const uid = req.uid;

  try {
    const row = db.prepare(`
      SELECT * FROM game_state WHERE uid = ?
    `).get(uid);

    if (!row) {
      return {
        success: false,
        message: "Nessuna partita trovata."
      };
    }

    return {
      success: true,
      data: {
        name: row.name,
        avatar: row.avatar,
        bot: row.bot,
        lastMessage: row.last_message,
        limState: row.lim_state
      }
    };

  } catch (err) {
    console.error("❌ Errore caricamento partita:", err);
    return {
      success: false,
      message: "Errore durante il caricamento."
    };
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  save,
  load
};
