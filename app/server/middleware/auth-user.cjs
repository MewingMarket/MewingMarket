/* =========================================================
   AUTH-USER — Versione 2027.503 SAFE MODE (PATCH COMPLETA)
   Fix: sessioni invalide → guest immediato
========================================================= */

const path = require("path");
const db = require(path.resolve(__dirname, "../db/database.cjs"));

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
    );
  } catch {
    return "";
  }
}

/* =========================================================
   MIDDLEWARE AUTH-USER (SAFE MODE + PATCH)
========================================================= */
module.exports = function authUser(req, res, next) {
  try {
    const raw = req.originalUrl || req.url || req.path || "";
    const pathLower = raw.toLowerCase();
    const cleanPath = pathLower.split("?")[0];

    console.log("AUTH-USER DEBUG → PATH:", cleanPath);

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
      "/api/utenti/me",
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

    let sessione = getUserSessionFromCookie(req);

    if (!sessione || typeof sessione !== "string") sessione = "";
    sessione = sessione.trim();

    if (sessione.length < 10) {
      console.log("AUTH-USER DEBUG → Sessione vuota/invalid → guest");

      if (isProtected) {
        return res.status(401).json({ success: false, error: "Non autorizzato" });
      }

      req.uid = null;
      req.user = null;
      return next();
    }

    console.log("AUTH-USER DEBUG → sessione cookie valida:", sessione);

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
