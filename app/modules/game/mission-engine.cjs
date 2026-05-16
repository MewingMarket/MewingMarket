const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

/* ============================================================
   CONFIG XP PER INTENT
============================================================ */
const XP_BY_INTENT = {
  saluto: 1,
  onboarding: 1,
  catalogo: 2,
  prodotto: 3,
  prezzo: 2,
  prezzo_prodotto: 2,
  acquisto_diretto: 4,
  missione_completata: 20,
  tutorial_prodotto: 5,
  guida: 5,
  motivazione: 3,
  video_motivazionale: 5,
  consiglio_rapido: 2,
  consiglio_del_giorno: 2,
  newsletter: 2,
  newsletter_subscribe: 10,
  newsletter_unsubscribe: 2,
  reminder: 2,
  novita: 2
};

function xpForIntent(intent) {
  return XP_BY_INTENT[intent] || 0;
}

/* ============================================================
   CURVA LIVELLO
============================================================ */
function xpNeededForLevel(level) {
  return 50 * level;
}

/* ============================================================
   INIT TABELLE (player_progress + missions)
============================================================ */
function initTables() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS player_progress (
      uid TEXT PRIMARY KEY,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      last_update INTEGER
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT,
      mission_key TEXT,
      status TEXT, -- active | completed | claimed
      progress INTEGER DEFAULT 0,
      target INTEGER DEFAULT 1,
      reward_xp INTEGER DEFAULT 10,
      title TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )
  `).run();
}

initTables();

/* ============================================================
   PLAYER PROGRESS HELPERS
============================================================ */
function getPlayerProgress(uid) {
  const row = db.prepare(`
    SELECT uid, xp, level
    FROM player_progress
    WHERE uid = ?
  `).get(uid);

  if (!row) {
    db.prepare(`
      INSERT INTO player_progress (uid, xp, level, last_update)
      VALUES (?, 0, 1, ?)
    `).run(uid, Date.now());

    return { uid, xp: 0, level: 1 };
  }

  return row;
}

function updatePlayerProgress(uid, xp, level) {
  db.prepare(`
    UPDATE player_progress
    SET xp = ?, level = ?, last_update = ?
    WHERE uid = ?
  `).run(xp, level, Date.now(), uid);
}

/* ============================================================
   MISSION DEFINITIONS (semplici, per intent)
============================================================ */
const MISSION_DEFS = {
  catalogo: {
    mission_key: "open_catalog",
    title: "Apri il catalogo",
    target: 1,
    reward_xp: 5
  },
  prodotto: {
    mission_key: "view_product",
    title: "Guarda un prodotto",
    target: 1,
    reward_xp: 5
  },
  missione_completata: {
    mission_key: "vendor_mission",
    title: "Completa una missione di vendita",
    target: 1,
    reward_xp: 20
  },
  tutorial_prodotto: {
    mission_key: "product_tutorial",
    title: "Guarda un tutorial prodotto",
    target: 1,
    reward_xp: 10
  },
  motivazione: {
    mission_key: "ask_motivation",
    title: "Chiedi motivazione all'Influencer",
    target: 1,
    reward_xp: 5
  },
  video_motivazionale: {
    mission_key: "watch_motivation_video",
    title: "Guarda un video motivazionale",
    target: 1,
    reward_xp: 10
  },
  newsletter_subscribe: {
    mission_key: "newsletter_signup",
    title: "Iscriviti alla newsletter",
    target: 1,
    reward_xp: 15
  }
};

function getOrCreateMission(uid, def) {
  const existing = db.prepare(`
    SELECT *
    FROM missions
    WHERE uid = ? AND mission_key = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(uid, def.mission_key);

  if (existing) return existing;

  const now = Date.now();
  const info = {
    uid,
    mission_key: def.mission_key,
    status: "active",
    progress: 0,
    target: def.target || 1,
    reward_xp: def.reward_xp || 10,
    title: def.title || def.mission_key,
    created_at: now,
    updated_at: now
  };

  db.prepare(`
    INSERT INTO missions (uid, mission_key, status, progress, target, reward_xp, title, created_at, updated_at)
    VALUES (@uid, @mission_key, @status, @progress, @target, @reward_xp, @title, @created_at, @updated_at)
  `).run(info);

  return db.prepare(`
    SELECT *
    FROM missions
    WHERE uid = ? AND mission_key = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(uid, def.mission_key);
}

/* ============================================================
   PROCESS EVENT (entry point)
============================================================ */
async function processEvent({ uid, intent, botAvatar }) {
  if (!uid) {
    return {
      xpEarned: 0,
      levelUp: null,
      completedMissions: []
    };
  }

  const xpGain = xpForIntent(intent);
  let progress = getPlayerProgress(uid);

  let xp = progress.xp + xpGain;
  let level = progress.level;
  let levelUp = null;

  // Level up loop
  while (xp >= xpNeededForLevel(level)) {
    xp -= xpNeededForLevel(level);
    level += 1;
    levelUp = {
      oldLevel: level - 1,
      newLevel: level
    };
  }

  updatePlayerProgress(uid, xp, level);

  const completedMissions = [];

  // Missioni legate all'intent
  const def = MISSION_DEFS[intent];
  if (def) {
    let mission = getOrCreateMission(uid, def);

    if (mission.status === "active") {
      const newProgress = mission.progress + 1;
      const now = Date.now();
      let newStatus = mission.status;

      if (newProgress >= mission.target) {
        newStatus = "completed";
        completedMissions.push({
          mission_key: mission.mission_key,
          title: mission.title
        });

        // XP extra per missione
        xp += mission.reward_xp;
        // ricontrollo level up da reward
        while (xp >= xpNeededForLevel(level)) {
          xp -= xpNeededForLevel(level);
          level += 1;
          levelUp = {
            oldLevel: level - 1,
            newLevel: level
          };
        }
        updatePlayerProgress(uid, xp, level);
      }

      db.prepare(`
        UPDATE missions
        SET progress = ?, status = ?, updated_at = ?
        WHERE id = ?
      `).run(newProgress, newStatus, now, mission.id);
    }
  }

  return {
    xpEarned: xpGain,
    levelUp,
    completedMissions
  };
}

module.exports = {
  processEvent
};
