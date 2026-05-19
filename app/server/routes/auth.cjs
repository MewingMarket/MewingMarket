/**
 * FILE: app/server/routes/auth.cjs
 * DESCRIZIONE: Endpoint autenticazione per frontend Java-mode
 * COMPATIBILE con router universale /api/<modulo>/<funzione>
 */

module.exports = {

  // ============================================================
  // GET /api/auth/me
  // Ritorna l’utente loggato (se presente)
  // ============================================================
  async me(req) {
    try {
      // Nessun utente autenticato
      if (!req.user) {
        return {
          success: true,
          user: null
        };
      }

      // Utente autenticato → ritorna i dati
      return {
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          nome: req.user.nome || null,
          ruolo: req.user.ruolo || null,
          livello: req.user.livello || null,   // compatibilità futura
          stato: req.user.stato || "attivo"    // fallback sicuro
        }
      };

    } catch (err) {
      console.error("❌ ERRORE /api/auth/me:", err);
      return {
        success: false,
        error: "Errore autenticazione"
      };
    }
  },

  // ============================================================
  // POST /api/auth/logout
  // ============================================================
  async logout(req) {
    try {
      // Non serve invalidare token lato server (stateless)
      return {
        success: true,
        message: "Logout eseguito"
      };

    } catch (err) {
      console.error("❌ ERRORE /api/auth/logout:", err);
      return {
        success: false,
        error: "Errore logout"
      };
    }
  },

  // ============================================================
  // ALIAS: /api/auth/logato (vecchio endpoint)
  // ============================================================
  async logato(req) {
    return {
      success: true,
      loggato: Boolean(req.user),
      user: req.user || null
    };
  },

  // ============================================================
  // ALIAS: /api/auth/jwt (vecchio endpoint)
  // ============================================================
  async jwt(req) {
    return {
      success: true,
      valido: Boolean(req.user),
      user: req.user || null
    };
  }
};
