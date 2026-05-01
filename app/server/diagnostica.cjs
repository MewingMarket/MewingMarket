/**
 * FILE: app/server/diagnostica.cjs
 * Modulo diagnostico lato server — Versione 2027.50
 * Compatibile con:
 * - universal-json
 * - router universale 2027.901
 * - introspect 2027.40
 */

module.exports = {

  /* ============================================================
     HOOK SERVER — log non invasivi + health avanzato
  ============================================================ */
  hookServer(app, { log, logErr }) {
    console.log("🟦 [DIAGNOSTICA] hookServer attivato");

    // Log richieste lente (solo > 500ms)
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
        pid: process.pid,
        cwd: process.cwd(),
        node: process.version,
        env: {
          port: process.env.PORT || null,
          node_env: process.env.NODE_ENV || null
        }
      });
    });

    // Log errori non gestiti (senza rompere universal-json)
    app.use((err, req, res, next) => {
      console.error("🔥 [DIAGNOSTICA] ERRORE NON GESTITO:", err);
      next(err);
    });
  },

  /* ============================================================
     HOOK ROUTER — log puliti e compatibili con router universale
  ============================================================ */
  hookRouter(router) {
    console.log("🟦 [DIAGNOSTICA] hookRouter attivato");

    router.use((req, res, next) => {
      console.log(`🔹 [ROUTER] ${req.method} ${req.originalUrl}`);
      next();
    });
  }
};
