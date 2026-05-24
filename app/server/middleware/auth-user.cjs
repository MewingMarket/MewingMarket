/* =========================================================
   AUTH-USER — Versione 2027.503 SAFE MODE
   Compatibile con:
   - cookie di sessione
   - router fuzzy universale
   - frontend 2058 (credentials: include)
   - /me pubblico
   - req.uid sempre coerente
========================================================= */

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

/* =========================================================
   ESTRAZIONE TOKEN DA COOKIE
========================================================= */
function getUserSessionFromCookie(req) {
  try {
    const c = req.cookies || {};
    return (
      c.session_user ||   // nuovo cookie
      c.sessione ||       // compatibilità
      c.session ||        // compatibilità
      c.token ||          // compatibilità
      ""
    ).trim();
  } catch {
    return "";
  }
}

/* =========================================================
   MIDDLEWARE AUTH-USER (SAFE MODE)
========================================================= */
module.exports = function authUser(req, res, next) {
  try {
    const raw = req.originalUrl || req.url || req.path || "";
    const pathLower = raw.toLowerCase();
    const cleanPath = pathLower.split("?")[0];

    console.log("AUTH-USER DEBUG → PATH:", cleanPath);

    /* =====================================================
       API PUBBLICHE — NON RICHIEDONO LOGIN
       /api/utenti/me è SEMPRE PUBBLICA
    ===================================================== */
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
      "/api/utenti/me",          // <--- SAFE MODE: sempre pubblico
      "/api/assistenza",
      "/api/upload"
    ];

    const isPublic = publicApiPrefixes.some(prefix =>
      cleanPath === prefix || cleanPath.startsWith(prefix + "/")
    );

    if (isPublic) {
      console.log("AUTH-USER DEBUG → PUBLIC API");
      req.uid = null;
      req.user = null;
      return next();
    }

    /* =====================================================
       API PROTETTE — RICHIEDONO LOGIN
    ===================================================== */
    const protectedApiPrefixes = [
      "/api/rimborso",
      "/api/vendite",
      "/api/ordini",
      "/api/feedback",
      "/api/vendite-download"
    ];

    const isProtected = protectedApiPrefixes.some(prefix =>
      cleanPath.startsWith(prefix)
    );

    /* =====================================================
       LETTURA TOKEN DA COOKIE
    ===================================================== */
    const sessione = getUserSessionFromCookie(req);
    console.log("AUTH-USER DEBUG → sessione cookie:", sessione ? "[PRESENTE]" : "[ASSENTE]");

    /* =====================================================
       SE NON È PROTETTA → PASSA COMUNQUE
       (ma tentiamo comunque di identificare l'utente)
    ===================================================== */
    if (!isProtected && !sessione) {
      req.uid = null;
      req.user = null;
      console.log("AUTH-USER DEBUG → API NON PROTETTA → PASSA");
      return next();
    }

    /* =====================================================
       API PROTETTA → SERVE SESSIONE
    ===================================================== */
    if (isProtected && !sessione) {
      console.log("AUTH-USER DEBUG → Nessun cookie per API protetta");
      return res.status(401).json({ success: false, error: "Non autorizzato" });
    }

    /* =====================================================
       VERIFICA SESSIONE SU DB
    ===================================================== */
    let row;
    try {
      row = db.prepare(`
        SELECT id, email, ruolo, codice_fiscale
        FROM utenti
        WHERE sessione = ?
        LIMIT 1
      `).get(sessione);
    } catch (err) {
      console.error("AUTH-USER SQL ERROR:", err);
      return res.status(500).json({ success: false, error: "Errore server" });
    }

    if (!row) {
      console.log("AUTH-USER DEBUG → Sessione non valida");
      if (isProtected) {
        return res.status(401).json({ success: false, error: "Non autorizzato" });
      }
      req.uid = null;
      req.user = null;
      return next();
    }

    /* =====================================================
       UTENTE VALIDO → req.uid + req.user
    ===================================================== */
    req.uid = row.id;
    req.user = {
      id: row.id,
      email: row.email,
      ruolo: row.ruolo,
      codice_fiscale: row.codice_fiscale,
      _diagnostica: "auth-user-ok"
    };

    console.log("AUTH-USER DEBUG → UTENTE OK:", row.email);

    return next();

  } catch (err) {
    console.error("AUTH-USER ERROR:", err);
    return res.status(500).json({ success: false, error: "Errore server" });
  }
};
