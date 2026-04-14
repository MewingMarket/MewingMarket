/**
 * app/server/middleware/cache.cjs
 * Middleware per disabilitare la cache + PATCH CORS 2026
 */

module.exports = function (app) {
  const ALLOWED_ORIGIN = "https://www.mewingmarket.it";

  app.use((req, res, next) => {
    try {
      // =====================================================
      // 🔥 PATCH CORS — permette al frontend di chiamare il backend
      // =====================================================
      res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

      // Preflight
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }

      // =====================================================
      // 🔥 NO-CACHE (tuo codice originale)
      // =====================================================
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

    } catch (err) {
      console.error("Errore set cache/CORS headers:", err);
    } finally {
      next();
    }
  });
};
