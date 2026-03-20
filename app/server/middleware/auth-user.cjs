// =========================================================
// AUTH-USER.CJS — Versione DEFINITIVA (2026)
// =========================================================

module.exports = function authUser(req, res, next) {
  try {
    const publicPaths = [
      "/", "/index", "/index.html",
      "/catalogo", "/catalogo.html",
      "/prodotto", "/prodotto.html",
      "/categories", "/categories.html",
      "/login", "/login.html",
      "/registrazione", "/registrazione.html",

      // RESET PASSWORD (PUBLIC)
      "/reset-password", "/reset-password.html",
      "/reset-password-request", "/reset-password-request.html",
      "/reset-password-confirm", "/reset-password-confirm.html",
      "/api/utenti/reset-password-request",
      "/api/utenti/reset-password-confirm",

      // RESET EMAIL (PUBLIC)
      "/reset-email", "/reset-email.html",
      "/reset-email-request", "/reset-email-request.html",
      "/reset-email-confirm", "/reset-email-confirm.html",
      "/api/utenti/reset-email-request",
      "/api/utenti/reset-email-confirm",

      // LOGIN & REGISTRAZIONE (PUBLIC)
      "/api/utenti/login",
      "/api/utenti/registrazione",

      // SEO & TRACKING (PUBLIC)
      "/seo", "/tracking", "/structured-data"
    ];

    const path = req.path.toLowerCase();

    // -----------------------------------------------------
    // 1) ROTTE PUBBLICHE — MAI BLOCCATE
    // -----------------------------------------------------
    if (publicPaths.some(p => path.startsWith(p))) {
      return next();
    }

    // -----------------------------------------------------
    // 2) LETTURA TOKEN (STANDARD)
    // -----------------------------------------------------
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token mancante" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ error: "Token mancante" });
    }

    // -----------------------------------------------------
    // 3) VERIFICA TOKEN (SQL)
    // -----------------------------------------------------
    req.db.get(
      "SELECT email, ruolo FROM utenti WHERE sessione = ? LIMIT 1",
      [token],
      (err, row) => {
        if (err) {
          console.error("AUTH SQL ERROR:", err);
          return res.status(500).json({ error: "Errore server" });
        }

        if (!row) {
          return res.status(401).json({ error: "Sessione non valida" });
        }

        // Utente autenticato
        req.user = {
          email: row.email,
          ruolo: row.ruolo
        };

        next();
      }
    );

  } catch (err) {
    console.error("AUTH-USER ERROR:", err);
    return res.status(500).json({ error: "Errore server" });
  }
};
