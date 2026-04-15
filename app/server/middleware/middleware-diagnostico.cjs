/**
 * =========================================================
 * Middleware Diagnostico — stampa tutte le route registrate
 * Versione 2026.300 — Simone Debug Mode
 * =========================================================
 */

module.exports = function diagnosticoRoutes(app) {
  console.log("🟦 [DIAGNOSTICO] ROUTE SCANNER ATTIVATO");

  const printRoute = (method, path) => {
    console.log(`🔹 ROUTE: ${method.toUpperCase()} ${path}`);
  };

  const scanLayer = (layer, prefix = "") => {
    if (layer.route) {
      const routePath = prefix + layer.route.path;
      const methods = Object.keys(layer.route.methods);
      methods.forEach(m => printRoute(m, routePath));
    } else if (layer.name === "router" && layer.handle.stack) {
      layer.handle.stack.forEach(sub => {
        scanLayer(sub, prefix + (layer.regexp?.source || ""));
      });
    }
  };

  console.log("🟦 [DIAGNOSTICO] SCANSIONE ROUTER PRINCIPALE…");
  app._router.stack.forEach(layer => scanLayer(layer));
};
