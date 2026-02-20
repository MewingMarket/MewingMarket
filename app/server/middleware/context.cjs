/**
 * app/server/middleware/context.cjs
 * Gestione aggiornamento contesto (page, slug) + safeText
 */

const path = require("path");

// PATCH: utils e context stanno in app/modules/
const { safeText } = require("../../modules/utils.cjs");
const Context = require("../../modules/context.cjs");

// GA4 è già nel percorso corretto
const { trackGA4 } = require("../services/ga4.cjs");

module.exports = function (app) {
  app.use((req, res, next) => {
    try {
      const uid = req.uid;
      req.body = req.body || {};
      req.query = req.query || {};

      const page = req.body.page ?? req.query.page ?? null;
      const slug = req.body.slug ?? req.query.slug ?? null;

      if (page || slug) {
        try {
          Context.update(uid, page, slug);
        } catch (err) {
          console.error("Context.update error:", err);

          if (typeof global.logEvent === "function") {
            global.logEvent("context_update_error", {
              uid,
              error: err?.message || "unknown"
            });
          }
        }

        trackGA4("page_view", { uid, page: page || "", slug: slug || "" });
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
