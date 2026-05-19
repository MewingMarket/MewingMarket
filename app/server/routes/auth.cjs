/**
 * FILE: app/server/routes/auth.cjs
 * DESCRIZIONE: Endpoint autenticazione per frontend Java-mode
 */

module.exports = {
  
  // ============================================================
  // GET /api/auth/me
  // Ritorna l’utente loggato (se presente)
  // ============================================================
  async me(req) {
    try {
      if (!req.user) {
        return {
          success: true,
          user: null
        };
      }

      return {
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          nome: req.user.nome || null,
          ruolo: req.user.ruolo || null
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
    return {
      success: true,
      message: "Logout eseguito"
    };
  }
};
