/**
 * app/server/middleware/context.cjs
 * Gestione aggiornamento contesto (page) + safeText
 */

const path = require("path");

// PATCH: require assoluti basati su process.cwd() con gestione errori
let safeText = (t) => t;
let Context = { update: () => {} };
let trackGA4 = () => {};

try {
  const utils = require(path.join(process.cwd(), "app/modules/utils.cjs"));
  if (utils.safeText) safeText = utils.safeText;
  
  Context = require(path.join(process.cwd(), "app/modules/context.cjs"));
  
  const ga4 = require(path.join(process.cwd(), "app/server/services/ga4.cjs"));
  if (ga4.trackGA4) trackGA4 = ga4.trackGA4;
  
  // PATCH DEBUG — conferma che il middleware è stato caricato
  console.log("### CONTEXT_MIDDLEWARE_LOADED ###", __filename);
} catch (e) {
  console.error("### CONTEXT_IMPORT_CRITICAL_ERROR ###", e.message);
}

module.exports = function (app) {
  // PATCH DEBUG — conferma che il middleware è stato registrato
  console.log("### CONTEXT_MIDDLEWARE_REGISTERED ###");

  app.use((req, res, next) => {
    try {

      // =========================================================
      // 🛑 ESCLUSIONE FILE STATICI (JS, CSS, HTML, IMG, FONT)
      // =========================================================
      if (/\.(js|css|html|png|jpg|jpeg|svg|webp|ico|woff|woff2)(\?|$)/.test(req.url)) {
        return next();
      }

      const uid = req.uid || "guest"; // Fallback per evitare crash se uid è assente
      req.body = req.body || {};
      req.query = req.query || {};

      const page = req.body.page ?? req.query.page ?? null;

      // PATCH DEBUG — log di ogni richiesta che passa dal middleware
      console.log("### CONTEXT_MIDDLEWARE_REQUEST ###", {
        uid,
        page,
        url: req.url,
        method: req.method
      });

      if (page) {
        try {
          // PATCH: rimosso slug
          if (Context && typeof Context.update === "function") {
            Context.update(uid, page);
          }
        } catch (err) {
          console.error("Context.update error:", err);

          if (typeof global.logEvent === "function") {
            global.logEvent("context_update_error", {
              uid,
              error: err?.message || "unknown"
            });
          }
        }

        // GA4 può continuare a ricevere slug, ma non lo salviamo più
        try {
          trackGA4("page_view", { uid, page: page || "" });
        } catch (gaErr) {
          console.error("GA4 tracking error:", gaErr.message);
        }
      }

      if (req.body.message && typeof req.body.message === "string") {
        req.body.message = safeText(req.body.message);
      }

      // Prosegue verso il prossimo middleware/rotta
      next();

    } catch (err) {
      console.error("Middleware context error:", err);

      if (typeof global.logEvent === "function") {
        try {
          global.logEvent("middleware_context_error", {
            error: err?.message || "unknown"
          });
        } catch (e) {}
      }

      // CRITICO: Anche in caso di errore totale, dobbiamo chiamare next()
      next();
    }
  });
};
