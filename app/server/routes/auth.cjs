/**
 * FILE: app/server/routes/auth.cjs
 * DESCRIZIONE: Endpoint autenticazione base per frontend
 */

module.exports = {
  async me(req) {
    try {
      // Se non c’è utente → non loggato
      if (!req.user) {
        return {
          success: true,
          user: null
        };
      }

      // Se loggato → ritorna i dati utente
      return {
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          nome: req.user.nome || null,
          livello: req.user.livello || null
        }
      };

    } catch (err) {
      console.error("❌ ERRORE /api/auth/me:", err);
      return {
        success: false,
        error: "Errore autenticazione"
      };
    }
  }
};
