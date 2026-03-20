// =========================================================
// AUTH-USER.CJS — Versione DEFINITIVA 2026.5
// Supporta automaticamente API e non-API + rotte /utenti
// =========================================================

module.exports = function authUser(req, res, next) {
  try {
    // LOG DIAGNOSTICI
    console.log("AUTH DEBUG → req.path:", req.path);
    console.log("AUTH DEBUG → req.url:", req.url);
    console.log("AUTH DEBUG → headers.authorization:", req.headers["authorization"]);

    // Normalizzazione path
    let path = req.path.toLowerCase().trim();

    // Rimuove slash finale (tranne "/")
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    // =====================================================
    // ROTTE PUBLIC — SOLO NOMI BASE (senza /api)
    // =====================================================
    const publicBase = [
      "/", "/index", "/index.html",
      "/catalogo", "/catalogo.html",
      "/prodotto", "/prodotto.html",
      "/categories", "/categories.html",
      "/login", "/login.html",
      "/registrazione", "/registrazione.html",

      // RESET PASSWORD
      "/reset-password", "/reset-password.html",
      "/reset-password-request",
      "/reset-password-confirm",
      "/utenti/reset-password-request",
      "/utenti/reset-password-confirm",

      // RESET EMAIL
      "/reset-email", "/reset-email.html",
      "/reset-email-request",
      "/reset-email-confirm",
      "/utenti/reset-email-request",
      "/utenti/reset-email-confirm",

      // LOGIN & REGISTRAZIONE
      "/login", "/registrazione",

      // SEO & TRACKING
      "/seo", "/tracking", "/structured-data"
    ];

    // =====================================================
    // MATCH AUTOMATICO API + NON API
    // =====================================================
    const isPublic = publicBase.some(base => {
      return (
        path === base ||                     // /reset-password-request
        path === "/api" + base ||            // /api/reset-password-request
        path.startsWith(base + "/") ||       // /reset-password-request/qualcosa
        path.startsWith("/api" + base + "/") || // /api/reset-password-request/qualcosa
        req.url.toLowerCase().startsWith(base + "?") || // /reset-password-request?x=1
        req.url.toLowerCase().startsWith("/api" + base + "?") // /api/reset-password-request?x=1
      );
    });

    if (isPublic) {
      console.log("AUTH DEBUG → PUBLIC MATCH:", path);
      return next();
    }

    // =====================================================
    // TOKEN RICHIESTO PER TUTTE LE ALTRE ROTTE
    // =====================================================
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("AUTH DEBUG → BLOCCO: Token mancante");
      return res.status(401).json({ error: "Token mancante" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.log("AUTH DEBUG → BLOCCO: Token vuoto");
      return res.status(401).json({ error: "Token mancante" });
    }

    // =====================================================
    // VERIFICA TOKEN (SQL)
    // =====================================================
    req.db.get(
      "SELECT email, ruolo FROM utenti WHERE sessione = ? LIMIT 1",
      [token],
      (err, row) => {
        if (err) {
          console.error("AUTH SQL ERROR:", err);
          return res.status(500).json({ error: "Errore server" });
        }

        if (!row) {
          console.log("AUTH DEBUG → BLOCCO: Sessione non valida");
          return res.status(401).json({ error: "Sessione non valida" });
        }

        req.user = {
          email: row.email,
          ruolo: row.ruolo
        };

        console.log("AUTH DEBUG → UTENTE OK:", req.user.email, req.user.ruolo);
        next();
      }
    );

  } catch (err) {
    console.error("AUTH-USER ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
};
