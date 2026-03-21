// =========================================================
// File: app/server/middleware/auth-admin.cjs
// Middleware ADMIN definitivo (SQL + token standard)
// Con LOG DIAGNOSTICI (2026.10)
// =========================================================

const db = require("../db/database.cjs");

module.exports = function (req, res, next) {
  try {
    // -----------------------------------------------------
    // LOG DIAGNOSTICI — VISUALIZZIAMO TUTTO
    // -----------------------------------------------------
    console.log("ADMIN DEBUG → req.path:", req.path);
    console.log("ADMIN DEBUG → req.url:", req.url);
    console.log("ADMIN DEBUG → headers.authorization:", req.headers["authorization"]);

    // -----------------------------------------------------
    // 1) LETTURA TOKEN
    // -----------------------------------------------------
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("ADMIN DEBUG → BLOCCO: Token mancante");
      return res.status(401).json({
        success: false,
        error: "Non loggato"
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.log("ADMIN DEBUG → BLOCCO: Token vuoto");
      return res.status(401).json({
        success: false,
        error: "Non loggato"
      });
    }

    // -----------------------------------------------------
    // 2) VERIFICA TOKEN NEL DB
    // -----------------------------------------------------
    const user = db
      .prepare("SELECT id, email, ruolo FROM utenti WHERE sessione = ? LIMIT 1")
      .get(token);

    if (!user) {
      console.log("ADMIN DEBUG → BLOCCO: Sessione non valida");
      return res.status(401).json({
        success: false,
        error: "Non loggato"
      });
    }

    // -----------------------------------------------------
    // 3) NORMALIZZAZIONE RUOLO
    // -----------------------------------------------------
    const ruoloRaw = String(user.ruolo || "").trim().toLowerCase();
    let ruoloNorm = "user";

    if (ruoloRaw.includes("admin") || ruoloRaw.includes("amministrator")) {
      ruoloNorm = "admin";
    } else if (ruoloRaw.includes("guest") || ruoloRaw.includes("ospite")) {
      ruoloNorm = "guest";
    }

    console.log("ADMIN DEBUG → Ruolo normalizzato:", ruoloNorm);

    // -----------------------------------------------------
    // 4) CONTROLLO RUOLO ADMIN
    // -----------------------------------------------------
    if (ruoloNorm !== "admin") {
      console.log("ADMIN DEBUG → BLOCCO: Utente non admin");
      return res.status(403).json({
        success: false,
        error: "Non autorizzato"
      });
    }

    // -----------------------------------------------------
    // 5) SALVATAGGIO DATI UTENTE
    // -----------------------------------------------------
    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = ruoloNorm;

    console.log("ADMIN DEBUG → ACCESSO ADMIN OK:", user.email);

    next();

  } catch (err) {
    console.error("❌ auth-admin ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
};
