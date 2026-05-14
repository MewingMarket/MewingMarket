/*
  FILE: app/server/routes/game.cjs
  DESC: Router unico per salvataggio e caricamento partita
*/

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

/* ============================================================
   SALVA PARTITA (crea una nuova riga)
============================================================ */
async function save(req) {
  const uid = req.uid;
  const body = req.body || {};

  try {
    db.prepare(`
      INSERT INTO game_state (uid, name, avatar, bot, last_message, lim_state, updated_at)
      VALUES (@uid, @name, @avatar, @bot, @last_message, @lim_state, @updated_at)
    `).run({
      uid,
      name: body.name || "",
      avatar: body.avatar || "",
      bot: body.bot || "",
      last_message: body.lastMessage || "",
      lim_state: body.limState || "",
      updated_at: Date.now()
    });

    return { success: true, message: "Partita salvata." };

  } catch (err) {
    console.error("❌ Errore salvataggio partita:", err);
    return { success: false, message: "Errore durante il salvataggio." };
  }
}

/* ============================================================
   LISTA PARTITE PER COMBO BOX
============================================================ */
async function list(req) {
  const uid = req.uid;

  try {
    const rows = db.prepare(`
      SELECT id, name, updated_at
      FROM game_state
      WHERE uid = ?
      ORDER BY updated_at DESC
    `).all(uid);

    return { success: true, data: rows };

  } catch (err) {
    console.error("❌ Errore lista partite:", err);
    return { success: false, message: "Errore durante il caricamento lista." };
  }
}

/* ============================================================
   CARICA UNA PARTITA SPECIFICA
============================================================ */
async function loadOne(req) {
  const id = req.body?.id;

  try {
    const row = db.prepare(`
      SELECT *
      FROM game_state
      WHERE id = ?
    `).get(id);

    if (!row) return { success: false, message: "Partita non trovata." };

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
    return { success: false, message: "Errore durante il caricamento." };
  }
}

module.exports = { save, list, loadOne };
