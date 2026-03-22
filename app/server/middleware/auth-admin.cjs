// =========================================================
// File: app/server/middleware/auth-admin.cjs
// Middleware ADMIN definitivo (SQL + CF Simone)
// Versione: 2026.30 — Admin via codice fiscale
// =========================================================

const db = require("../db/database.cjs");

// CF di Simone = admin assoluto
const CF_ADMIN = "GRSSMN92H25I138W";

module.exports = function (req, res, next) {
  try {
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
      .prepare("SELECT id, email, ruolo, codice_fiscale FROM utenti WHERE sessione = ? LIMIT 1")
      .get(token);

    if (!user) {
      console.log("ADMIN DEBUG → BLOCCO: Sessione non valida");
      return res.status(401).json({
        success: false,
        error: "Non loggato"
      });
    }

    // -----------------------------------------------------
    // 3) ADMIN VIA CODICE FISCALE
    // -----------------------------------------------------
    const cf = String(user.codice_fiscale || "").trim().toUpperCase();
    let ruoloNorm = "user";

    if (cf === CF_ADMIN) {
      ruoloNorm = "admin";
    } else {
      // fallback opzionale (non necessario, ma non fa male)
      const ruoloRaw = String(user.ruolo || "").trim().toLowerCase();
      if (ruoloRaw.includes("admin") || ruoloRaw.includes("amministrator")) {
        ruoloNorm = "admin";
      } else if (ruoloRaw.includes("guest") || ruoloRaw.includes("ospite")) {
        ruoloNorm = "guest";
      }
    }

    console.log("ADMIN DEBUG → Ruolo normalizzato:", ruoloNorm, "CF:", cf);

    // -----------------------------------------------------
    // 4) BLOCCO SE NON ADMIN
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
