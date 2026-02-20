/**
 * app/server/middleware/cache.cjs
 * Middleware per disabilitare la cache
 */

module.exports = function (app) {
  app.use((req, res, next) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    } catch (err) {
      console.error("Errore set cache headers:", err);
    } finally {
      next();
    }
  });
};
