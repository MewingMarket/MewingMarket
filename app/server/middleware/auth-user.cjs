// =========================================================
// AUTH-USER.CJS — Versione 2026.40 (HEADER + COOKIE SUPPORT)
// =========================================================

const path = require("path");

// PATCH: require assoluto del DB (fallback)
const dbAbsolute = require(path.join(process.cwd(), "app/server/db/database.cjs"));

function getTokenFromHeader(req) {
  const h = req.headers["authorization"];
  if (!h || !h.startsWith("Bearer ")) return "";
  return h.replace("Bearer ", "").trim();
}

function getTokenFromCookie(req) {
  if (!req.cookies) return "";
  // adatta questi nomi ai tuoi reali cookie di sessione
  return (
    req.cookies.sessione ||
    req.cookies.session ||
    req.cookies.token ||
    ""
  ).trim();
}

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
      "/chat-voice",

      // ⭐ PATCH: health API pubblica
      "/health",
      "/api/health"
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
    // TOKEN: HEADER O COOKIE
    // =====================================================
    let token = getTokenFromHeader(req);

    if (!token) {
      token = getTokenFromCookie(req);
      console.log("AUTH DEBUG → token da cookie:", token ? "[PRESENTE]" : "[ASSENTE]");
    } else {
      console.log("AUTH DEBUG → token da header:", "[PRESENTE]");
    }

    if (!token) {
      console.log("AUTH DEBUG → Nessun token → guest");
      req.user = null;
      return next();
    }

    // =====================================================
    // VERIFICA TOKEN SQL
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
      codice_fiscale: row.codice_fiscale,
      _diagnostica: "auth-user-ok"
    };

    console.log("AUTH DEBUG → UTENTE OK:", req.user.email, req.user.ruolo);

    next();

  } catch (err) {
    console.error("AUTH-USER ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
};
