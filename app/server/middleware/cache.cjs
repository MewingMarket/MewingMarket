/**
 * app/server/middleware/cache.cjs
 * Middleware per disabilitare la cache + PATCH CORS 2027 (SAFE)
 */

module.exports = function (app) {
  const ALLOWED_ORIGIN = "https://www.mewingmarket.it";

  app.use((req, res, next) => {
    try {
      // DEBUG
      console.log("🟦 [CACHE+CORS] Middleware attivo →", req.method, req.url);

      // =====================================================
      // 🔥 PATCH CORS — SEMPRE PERMESSO
      // =====================================================
      res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

      // =====================================================
      // 🔥 PATCH 2027 — RISPOSTA IMMEDIATA SU OPTIONS
      // =====================================================
      if (req.method === "OPTIONS") {
        console.log("🟧 Preflight OPTIONS → Risposta 204 (OK)");
        return res.sendStatus(204); // Deve rispondere, non può solo fare next()
      }

      // =====================================================
      // 🔥 NO-CACHE
      // =====================================================
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      next();

    } catch (err) {
      console.error("❌ Errore set cache/CORS headers:", err);
      next();
    }
  });
};
