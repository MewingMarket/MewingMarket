// =========================================================
// AUTH-USER.CJS — Versione PERFETTA 2026.6
// Non rompe le balle alle rotte pubbliche
// =========================================================

module.exports = function authUser(req, res, next) {
  try {
    const path = req.path.toLowerCase();

    // LOG DIAGNOSTICI
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
    // TUTTO IL RESTO RICHIEDE TOKEN
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
    // VERIFICA TOKEN SQL
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

        req.user = { email: row.email, ruolo: row.ruolo };
        console.log("AUTH DEBUG → UTENTE OK:", req.user.email, req.user.ruolo);
        next();
      }
    );

  } catch (err) {
    console.error("AUTH-USER ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
};
