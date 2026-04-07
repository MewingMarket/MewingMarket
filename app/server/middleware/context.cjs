/**
 * app/server/middleware/context.cjs
 * Gestione aggiornamento contesto (page) + safeText
 */

const path = require("path");

// PATCH: require assoluti basati su process.cwd()
const { safeText } = require(path.join(process.cwd(), "app/modules/utils.cjs"));
const Context = require(path.join(process.cwd(), "app/modules/context.cjs"));

// GA4 è già nel percorso corretto
const { trackGA4 } = require("../services/ga4.cjs");

module.exports = function (app) {
  app.use((req, res, next) => {
    try {
      const uid = req.uid;
      req.body = req.body || {};
      req.query = req.query || {};

      const page = req.body.page ?? req.query.page ?? null;

      if (page) {
        try {
          // PATCH: rimosso slug
          Context.update(uid, page);
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
        trackGA4("page_view", { uid, page: page || "" });
      }

      if (typeof req.body.message === "string") {
        req.body.message = safeText(req.body.message);
      }

      next();

    } catch (err) {
      console.error("Middleware context error:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("middleware_context_error", {
          error: err?.message || "unknown"
        });
      }

      next();
    }
  });
};
