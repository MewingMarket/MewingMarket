// =========================================================
// AUTH-USER.CJS — Versione 2026.32 (PATCH STABILITÀ + ID UTENTE)
// Compatibile better-sqlite3 + sessioni SQL + CF
// =========================================================

const path = require("path");

// PATCH: require assoluto del DB (fallback)
const dbAbsolute = require(path.join(process.cwd(), "app/server/db/database.cjs"));

module.exports = function authUser(req, res, next) {
  try {
    const pathLower = req.path.toLowerCase();

    console.log("AUTH DEBUG → req.path:", pathLower);
    console.log("AUTH DEBUG → headers.authorization:", req.headers["authorization"]);

    // =====================================================
    // ROTTE COMPLETAMENTE PUBBLICHE
    // =====================================================
    const publicPaths = [
      "/", "/index", "/index.html",
      "/catalogo", "/catalogo.html",
      "/prodotto", "/prodotto.html",
      "/categories", "/categories.html",
      "/login", "/login.html",
      "/registrazione", "/registrazione.html",

      "/utenti/login",
      "/utenti/registrazione",
      "/api/utenti/login",
      "/api/utenti/registrazione",

      "/products",
      "/products/",
      "/products/:id",

      "/reset-password", "/reset-password.html",
      "/reset-password-request",
      "/reset-password-confirm",
      "/utenti/reset-password-request",
      "/utenti/reset-password-confirm",

      "/reset-email", "/reset-email.html",
      "/reset-email-request",
      "/reset-email-confirm",
      "/utenti/reset-email-request",
      "/utenti/reset-email-confirm",

      "/sitemap.xml",
      "/system-status",
      "/meta-feed",
      "/newsletter",
      "/structured-data",

      "/paypal-create",
      "/paypal-complete",
      "/paypal-cancel",

      "/chat",
      "/chat-voice"
    ];

    const isPublic = publicPaths.some(base =>
      pathLower === base ||
      pathLower.startsWith(base + "/") ||
      req.url.toLowerCase().startsWith(base + "?")
    );

    if (isPublic) {
      console.log("AUTH DEBUG → PUBLIC MATCH:", pathLower);
      return next();
    }

    // =====================================================
    // TOKEN (se manca → guest)
    // =====================================================
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("AUTH DEBUG → Nessun token → guest");
      req.user = null;
      return next();
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.log("AUTH DEBUG → Token vuoto → guest");
      req.user = null;
      return next();
    }

    // =====================================================
    // VERIFICA TOKEN SQL (PATCH: includiamo id)
    // =====================================================
    const db = req.db || req.app.get("db") || dbAbsolute;
    if (!db) {
      console.error("AUTH ERROR → db mancante");
      return res.status(500).json({ error: "Errore server" });
    }

    let row;
    try {
      row = db.prepare(
        "SELECT id, email, ruolo, codice_fiscale FROM utenti WHERE sessione = ? LIMIT 1"
      ).get(token);
    } catch (err) {
      console.error("AUTH SQL ERROR:", err);
      return res.status(500).json({ error: "Errore server" });
    }

    if (!row) {
      console.log("AUTH DEBUG → Token non valido → guest");
      req.user = null;
      return next();
    }

    req.user = {
      id: row.id,
      email: row.email,
      ruolo: row.ruolo,
      codice_fiscale: row.codice_fiscale
    };

    console.log("AUTH DEBUG → UTENTE OK:", req.user.email, req.user.ruolo);

    next();

  } catch (err) {
    console.error("AUTH-USER ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
};
