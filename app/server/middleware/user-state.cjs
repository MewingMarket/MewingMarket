/**
 * app/server/middleware/user-state.cjs
 * Gestione UID + stato utente globale
 */

// PATCH: percorso corretto verso il modulo bot
const { generateUID } = require("../../../modules/bot/index.cjs");

// Stato utenti globale (come nel file originale)
const userStates = {};

module.exports = function (app) {
  // Esponiamo userStates globalmente per compatibilità
  global.userStates = userStates;

  app.use((req, res, next) => {
    try {
      let uid = null;

      try {
        uid = req.cookies?.mm_uid || null;
      } catch {
        uid = null;
      }

      const invalid =
        !uid ||
        typeof uid !== "string" ||
        !uid.startsWith("mm_") ||
        uid.length < 5;

      if (invalid) {
        uid = generateUID();
        res.cookie("mm_uid", uid, {
          httpOnly: false,
          secure: true,
          sameSite: "None",
          maxAge: 1000 * 60 * 60 * 24 * 30
        });

        if (typeof global.logEvent === "function") {
          global.logEvent("uid_generated", { uid });
        }
      }

      if (!userStates[uid]) {
        userStates[uid] = { state: "menu", lastIntent: null, data: {} };

        if (typeof global.logEvent === "function") {
          global.logEvent("user_state_init", { uid });
        }
      }

      req.uid = uid;
      req.userState = userStates[uid];

      next();

    } catch (err) {
      console.error("User state middleware error:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("user_state_error", { error: err?.message || "unknown" });
      }

      next();
    }
  });
};
