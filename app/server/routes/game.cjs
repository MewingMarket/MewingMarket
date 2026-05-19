/*
  FILE: app/server/routes/game.cjs
  VERSIONE: 2027.2 — PATCH STABILE
  DESC: Router unico per salvataggio, lista e caricamento partite
*/

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

/* ============================================================
   UTILS
============================================================ */
function safe(v, fallback = "") {
  return v === undefined || v === null ? fallback : v;
}

/* ============================================================
   SALVA PARTITA
   /api/game/save
============================================================ */
async function save(req) {
  try {
    const uid = req.uid;
    const body = req.body || {};

    if (!uid) {
      return { success: false, message: "UID mancante" };
    }

    db.prepare(`
      INSERT INTO game_state (uid, name, avatar, bot, last_message, lim_state, updated_at)
      VALUES (@uid, @name, @avatar, @bot, @last_message, @lim_state, @updated_at)
    `).run({
      uid,
      name: safe(body.name),
      avatar: safe(body.avatar),
      bot: safe(body.bot),
      last_message: safe(body.lastMessage),
      lim_state: safe(body.limState),
      updated_at: Date.now()
    });

    return { success: true, message: "Partita salvata." };

  } catch (err) {
    console.error("❌ Errore salvataggio partita:", err);
    return { success: false, message: "Errore durante il salvataggio." };
  }
}

/* ============================================================
   LISTA PARTITE
   /api/game/list
============================================================ */
async function list(req) {
  try {
    const uid = req.uid;
    if (!uid) return { success: false, message: "UID mancante" };

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
   CARICA UNA PARTITA
   /api/game/loadOne
============================================================ */
async function loadOne(req) {
  try {
    const id = req.body?.id;

    if (!id || isNaN(Number(id))) {
      return { success: false, message: "ID non valido" };
    }

    const row = db.prepare(`
      SELECT *
      FROM game_state
      WHERE id = ?
    `).get(id);

    if (!row) {
      return { success: false, message: "Partita non trovata." };
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
    return { success: false, message: "Errore durante il caricamento." };
  }
}

/* ============================================================
   ALIAS COMPATIBILITÀ FRONTEND
============================================================ */
async function saveGame(req) { return save(req); }
async function listGames(req) { return list(req); }
async function loadGame(req) { return loadOne(req); }

/* ============================================================
   EXPORT — Java-mode
============================================================ */
module.exports = {
  save,
  list,
  loadOne,

  // alias
  saveGame,
  listGames,
  loadGame
};
