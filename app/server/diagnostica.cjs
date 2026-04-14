/**
 * FILE: app/server/diagnostica.cjs
 * Modulo diagnostico lato server — 2026
 */

module.exports = {
  hookServer(app, { log, logErr }) {
    console.log("🟦 [DIAGNOSTICA] hookServer attivato");

    // Log richieste lente
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        const ms = Date.now() - start;
        if (ms > 500) {
          console.log(`🟧 [LENTO] ${req.method} ${req.url} → ${ms}ms`);
        }
      });
      next();
    });

    // Endpoint diagnostico avanzato
    app.get("/admin/health-advanced", (req, res) => {
      res.json({
        status: "ok",
        time: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      });
    });
  },

  hookRouter(router) {
    console.log("🟦 [DIAGNOSTICA] hookRouter attivato");

    router.use((req, res, next) => {
      console.log("🔹 [ROUTER] →", req.method, req.url);
      next();
    });
  }
};
