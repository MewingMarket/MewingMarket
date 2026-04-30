/* =========================================================
   AUTH-USER.CJS — Versione 2027.501 (SAFE + UNIVERSALE)
   FIX: null.id • FIX: match API • FIX: Express path issues
========================================================= */

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
  return (
    req.cookies.sessione ||
    req.cookies.session ||
    req.cookies.token ||
    ""
  ).trim();
}

module.exports = function authUser(req, res, next) {
  try {
    // =====================================================
    // FIX: Express può cambiare req.path → usiamo originalUrl
    // =====================================================
    const raw = req.originalUrl || req.url || req.path || "";
    const pathLower = raw.toLowerCase();
    const cleanPath = pathLower.split("?")[0];

    console.log("AUTH DEBUG → PATH:", cleanPath);

    // =====================================================
    // ⭐ API PUBBLICHE — NON RICHIEDONO LOGIN
    // =====================================================
    const publicApiPrefixes = [
      "/api/versione",
      "/api/system-status",
      "/api/health",
      "/api/prodotti",
      "/api/catalogo",
      "/api/recensioni-top",
      "/api/product-page",
      "/api/sitemap",
      "/api/meta-feed",
      "/api/newsletter",
      "/api/chat",
      "/api/chat-voice",
      "/api/paypal-create",
      "/api/paypal-complete",
      "/api/paypal-cancel",
      "/api/paypal-ricrea",
      "/api/utenti/login",
      "/api/utenti/registrazione",
      "/api/assistenza",
      "/api/upload"
    ];

    const isPublicApi = publicApiPrefixes.some(prefix =>
      cleanPath === prefix || cleanPath.startsWith(prefix + "/")
    );

    if (isPublicApi) {
      console.log("AUTH DEBUG → PUBLIC API:", cleanPath);
      return next();
    }

    // =====================================================
    // ⭐ API CHE RICHIEDONO LOGIN
    // =====================================================
    const protectedApiPrefixes = [
      "/api/admin",
      "/api/rimborso",
      "/api/vendite",
      "/api/ordini",
      "/api/feedback",
      "/api/vendite-download"
    ];

    const isProtected = protectedApiPrefixes.some(prefix =>
      cleanPath.startsWith(prefix)
    );

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

    // =====================================================
    // SE NON È PROTETTA → PASSA SEMPRE
    // =====================================================
    if (!isProtected) {
      console.log("AUTH DEBUG → API NON PROTETTA → PASSA");
      req.user = null; // NON CAUSA PIÙ ERRORI
      return next();
    }

    // =====================================================
    // SE È PROTETTA → SERVE TOKEN
    // =====================================================
    if (!token) {
      console.log("AUTH DEBUG → Nessun token per API protetta");
      return res.status(401).json({ error: "Non autorizzato" });
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
      console.log("AUTH DEBUG → Token non valido per API protetta");
      return res.status(401).json({ error: "Non autorizzato" });
    }

    // =====================================================
    // FIX: req.user SEMPRE VALIDO
    // =====================================================
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
