// =========================================================
// AUTH-USER.CJS — Versione SUPER-PERMISSIVA (DEFINITIVA)
// =========================================================

module.exports = function authUser(req, res, next) {
  try {
    const publicPaths = [
      "/", "/index", "/index.html",
      "/catalogo", "/catalogo.html",
      "/prodotto", "/prodotto.html",
      "/categories", "/categories.html",
      "/checkout", "/checkout.html",
      "/login", "/login.html",
      "/registrazione", "/registrazione.html",
      "/reset-password-request", "/reset-password-confirm",
      "/reset-email-request", "/reset-email-confirm",
      "/api/utenti/login",
      "/api/utenti/registrazione",
      "/api/utenti/reset-password-request",
      "/api/utenti/reset-password-confirm",
      "/api/utenti/reset-email-request",
      "/api/utenti/reset-email-confirm",
      "/api/products",
      "/api/paypal/create-order",
      "/api/paypal/execute-order",
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
    // 2) LETTURA TOKEN
    // -----------------------------------------------------
    const token = req.headers["x-token"];
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
