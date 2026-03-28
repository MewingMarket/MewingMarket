// =========================================================
// AUTH-USER.CJS — Versione 2026.32 (PATCH STABILITÀ + ID UTENTE)
// Compatibile better-sqlite3 + sessioni SQL + CF
// =========================================================

module.exports = function authUser(req, res, next) {
  try {
    const path = req.path.toLowerCase();

    console.log("AUTH DEBUG → req.path:", path);
    console.log("AUTH DEBUG → headers.authorization:", req.headers["authorization"]);

    // =====================================================
    // ROTTE COMPLETAMENTE PUBBLICHE
    // =====================================================
    const publicPaths = [

      // Pagine pubbliche
      "/", "/index", "/index.html",
      "/catalogo", "/catalogo.html",
      "/prodotto", "/prodotto.html",
      "/categories", "/categories.html",
      "/login", "/login.html",
      "/registrazione", "/registrazione.html",

      // Login & Registrazione (PUBLIC)
      "/utenti/login",
      "/utenti/registrazione",
      "/api/utenti/login",
      "/api/utenti/registrazione",

      // Catalogo API (PUBLIC)
      "/products",
      "/products/",
      "/products/:id",

      // Reset password (PUBLIC)
      "/reset-password", "/reset-password.html",
      "/reset-password-request",
      "/reset-password-confirm",
      "/utenti/reset-password-request",
      "/utenti/reset-password-confirm",

      // Reset email (PUBLIC)
      "/reset-email", "/reset-email.html",
      "/reset-email-request",
      "/reset-email-confirm",
      "/utenti/reset-email-request",
      "/utenti/reset-email-confirm",

      // SEO & SYSTEM
      "/sitemap.xml",
      "/system-status",
      "/meta-feed",
      "/newsletter",
      "/structured-data",

      // PayPal callback (PUBLIC)
      "/paypal-create",
      "/paypal-complete",
      "/paypal-cancel",

      // Chat pubblica
      "/chat",
      "/chat-voice"
    ];

    // MATCH PUBLIC
    const isPublic = publicPaths.some(base =>
      path === base ||
      path.startsWith(base + "/") ||
      req.url.toLowerCase().startsWith(base + "?")
    );

    if (isPublic) {
      console.log("AUTH DEBUG → PUBLIC MATCH:", path);
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
    const db = req.db || req.app.get("db");
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

    // =====================================================
    // PATCH: TOKEN NON VALIDO → NON BLOCCARE
    // =====================================================
    if (!row) {
      console.log("AUTH DEBUG → Token non valido → guest");
      req.user = null;
      return next();
    }

    // =====================================================
    // UTENTE OK (PATCH: includiamo id)
    // =====================================================
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
