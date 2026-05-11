// FILE: app/server/middleware/api-guard.cjs

const NAME_REGEX = /^[a-z0-9_-]{1,40}$/i;

const SENSITIVE_MODULES = new Set([
  "admin", "paypal", "ordini", "vendite", "rimborso", "utenti"
]);

const PUBLIC_MODULES = new Set([
  "prodotti", "ai", "recensioni", "newsletter", "generico", "diagnostica"
]);

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_PUBLIC = 20;
const RATE_LIMIT_SENSITIVE = 8;

const rateMap = new Map();

function rateKey(req, modulo, funzione) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
  return `${ip}::${modulo}::${funzione}`;
}

function checkRate(req, res, modulo, funzione) {
  const key = rateKey(req, modulo, funzione);
  const now = Date.now();
  const entry = rateMap.get(key) || { count: 0, ts: now };

  if (now - entry.ts > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.ts = now;
  }

  entry.count++;

  let limit = RATE_LIMIT_MAX;
  if (SENSITIVE_MODULES.has(modulo)) limit = RATE_LIMIT_SENSITIVE;
  else if (PUBLIC_MODULES.has(modulo)) limit = RATE_LIMIT_PUBLIC;

  rateMap.set(key, entry);

  if (entry.count > limit) {
    console.warn("🛑 [API-GUARD] RATE LIMIT:", key, "count:", entry.count);
    res.status(429).json({ success: false, error: "Troppe richieste, riprova tra poco." });
    return false;
  }

  return true;
}

module.exports = function apiGuard(req, res, next) {
  // /api/:modulo/:funzione oppure /api/js-list /api/ping ecc.
  const parts = req.path.split("/").filter(Boolean); // ["prodotti","getProdotti"] ecc.

  // lasciamo passare /ping, /js-list, ecc.
  if (parts.length < 2) return next();

  const modulo = parts[0].toLowerCase();
  const funzione = parts[1].toLowerCase();

  if (!NAME_REGEX.test(modulo) || !NAME_REGEX.test(funzione)) {
    console.warn("⚠️ [API-GUARD] modulo/funzione non validi:", modulo, funzione);
    return res.json({ success: false, error: "Endpoint non valido" });
  }

  if (!checkRate(req, res, modulo, funzione)) return;

  // timeout di sicurezza lato risposta
  res.setTimeout(5000, () => {
    console.warn("⏱️ [API-GUARD] Timeout risposta:", modulo, funzione);
    try {
      res.json({ success: false, error: "Timeout" });
    } catch {}
  });

  next();
};
