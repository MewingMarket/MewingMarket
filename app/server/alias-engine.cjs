/* =========================================================
 * alias-engine.cjs
 * Versione 2027.999 — Alias GET+HEAD + fallback statico
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

module.exports = function aliasEngine(app, { log, logErr }) {

  const APPDATA = path.join(process.cwd(), "app/data");
  const PERSIST = path.join(process.cwd(), "data/json");
  const BACKUP  = "/var/data/json";

  function resolveJson(filename) {
    const f1 = path.join(APPDATA, filename);
    const f2 = path.join(PERSIST, filename);
    const f3 = path.join(BACKUP, filename);

    if (fs.existsSync(f1)) return { file: f1, src: "app/data" };
    if (fs.existsSync(f2)) return { file: f2, src: "data/json" };
    if (fs.existsSync(f3)) return { file: f3, src: "/var/data/json" };

    return null;
  }

  async function tryApi(apiRoute) {
    try {
      const url = `http://localhost:${process.env.PORT}${apiRoute}`;
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch {}
    return null;
  }

  function alias(route, apiRoute, filename) {

    // GET
    app.get(route, async (req, res) => {
      log(`➡️ [ALIAS] GET ${route}`);

      // 1) API
      const apiJson = await tryApi(`/api/${apiRoute}`);
      if (apiJson) {
        log(`🟦 [API] ${route} → /api/${apiRoute}`);
        return res.json(apiJson);
      }

      // 2–4) Static fallback
      const resolved = resolveJson(filename);
      if (resolved) {
        log(`🟩 [STATIC] ${route} → ${resolved.src}/${filename}`);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.sendFile(resolved.file);
      }

      logErr(`❌ [404] ${route} nessuna sorgente trovata`);
      return res.status(404).json({ error: "File non trovato" });
    });

    // HEAD
    app.head(route, (req, res) => {
      const resolved = resolveJson(filename);
      if (resolved) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        log(`🟩 [HEAD] ${route} → ${resolved.src}/${filename}`);
        return res.status(200).end();
      }
      return res.status(404).end();
    });
  } 
/* =========================================================
   * REGISTRAZIONE ALIAS
   * ========================================================= */

  alias("/products",        "products",        "products.json");
  alias("/products/:id",    "products/:id",    "products.json");
  alias("/categories",      "categories",      "categories.json");
  alias("/catalog",         "catalog",         "catalog.json");
  alias("/youtube",         "youtube",         "youtube.json");

  alias("/recensioni",      "recensioni",      "recensioni.json");
  alias("/recensioni-top",  "recensioni-top",  "recensioni-top.json");

  alias("/product-page/:id","product-page/:id","products.json");

  alias("/feedback",        "feedback",        "feedback.json");
  alias("/assistenza",      "assistenza",      "assistenza.json");

  alias("/chat",            "chat",            "chat.json");
  alias("/chat-voice",      "chat-voice",      "chat-voice.json");

  alias("/meta-feed",       "meta-feed",       "meta-feed.json");
  alias("/versione",        "versione",        "versione.json");
  alias("/system-status",   "system-status",   "system-status.json");

  alias("/utenti/evento",   "utenti/evento",   "user-events.json");

  alias("/upload",          "upload",          "upload.json");

  alias("/orders",          "orders",          "orders.json");
  alias("/sales",           "sales",           "sales.json");
  alias("/newsletter",      "newsletter",      "newsletter.json");
  alias("/user-events",     "user-events",     "user-events.json");

  alias("/kpi-daily",       "kpi-daily",       "kpi-daily.json");
  alias("/kpi-weekly",      "kpi-weekly",      "kpi-weekly.json");
  alias("/kpi-monthly",     "kpi-monthly",     "kpi-monthly.json");

  alias("/backups",         "backups",         "backups.json");
  alias("/schema",          "schema",          "schema.json");

  alias("/paypal/create",   "paypal/create",   "paypal-create.json");
  alias("/paypal/complete", "paypal/complete", "paypal-complete.json");
  alias("/paypal/cancel",   "paypal/cancel",   "paypal-cancel.json");
  alias("/paypal/ricrea",   "paypal/ricrea",   "paypal-ricrea.json");

  log("🟩 Alias Engine caricato con successo");
}; 
