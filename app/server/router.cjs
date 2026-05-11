/* =========================================================
   ROUTER UNIVERSALE — Versione 2050 (HARDENED)
   - Validazione input
   - Rate limit leggero
   - Timeout handler
========================================================= */

const express = require("express");
const router = express.Router();
const path = require("path");
const funzioni = require("./index.cjs");

// Middleware auth
const R = (p) => require(path.join(process.cwd(), "app/server", p));
const authUser = R("middleware/auth-user.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

// Router js-list (handler diretto)
const jslist = require("./routes/jslist.cjs");

/* =========================================================
   CONFIG SICUREZZA
========================================================= */

// opzionale: se vuoi stringere, popola questa whitelist
const MODULE_WHITELIST = null; // es: ["prodotti","ordini","paypal","utenti"]

const NAME_REGEX = /^[a-z0-9_-]+$/i;

// rate limit in memoria (IP + modulo + funzione)
const RATE_LIMIT_WINDOW_MS = 10_000; // 10s
const RATE_LIMIT_MAX_CALLS = 30;
const rateMap = new Map();

function rateKey(req, modulo, funzione) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
  return `${ip}::${modulo}::${funzione}`;
}

function checkRateLimit(req, res, modulo, funzione) {
  const key = rateKey(req, modulo, funzione);
  const now = Date.now();
  const entry = rateMap.get(key) || { count: 0, ts: now };

  if (now - entry.ts > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.ts = now;
  }

  entry.count++;
  rateMap.set(key, entry);

  if (entry.count > RATE_LIMIT_MAX_CALLS) {
    console.warn("🛑 RATE LIMIT:", key, "count:", entry.count);
    res.status(429).json({ success: false, error: "Troppe richieste, riprova tra poco." });
    return false;
  }

  return true;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout handler")), ms))
  ]);
}

/* =========================================================
   ENDPOINT SPECIALI
========================================================= */

// /api/js-list → handler diretto
router.get("/js-list", jslist);

// /api/ping → diagnostica base
router.get("/ping", (req, res) => res.json({ ok: true, ts: Date.now() }));

/* =========================================================
   ROUTER MODULO/FUNZIONE (HARDENED)
========================================================= */
router.all("/:modulo/:funzione", async (req, res) => {
  const started = Date.now();

  try {
    let { modulo, funzione } = req.params;
    const m = String(modulo || "").toLowerCase();
    const f = String(funzione || "").toLowerCase();

    // validazione base nomi
    if (!NAME_REGEX.test(m) || !NAME_REGEX.test(f)) {
      console.warn("⚠️ ROUTER: nome modulo/funzione non valido:", m, f);
      return res.json({ success: false, error: "Endpoint non valido" });
    }

    // whitelist opzionale
    if (Array.isArray(MODULE_WHITELIST) && !MODULE_WHITELIST.includes(m)) {
      console.warn("⚠️ ROUTER: modulo non in whitelist:", m);
      return res.json({ success: false, error: "Modulo non autorizzato" });
    }

    // rate limit leggero
    if (!checkRateLimit(req, res, m, f)) return;

    const mod = funzioni[m];
    if (!mod) {
      console.warn("⚠️ ROUTER: modulo non trovato:", m);
      return res.json({ success: false, error: "Modulo non trovato" });
    }

    let handler = mod[f];

    if (!handler && f === "getpublic") {
      handler = mod.getPublic || mod.getProductsPublic || mod.getProdotti;
    }

    if (typeof handler !== "function") {
      console.warn("⚠️ ROUTER: funzione non trovata:", m, f);
      return res.json({ success: false, error: "Funzione non trovata" });
    }

    // auth admin
    if (m === "admin") {
      const ok = await authAdmin(req, res);
      if (ok === false) return;
    }

    // auth user
    if (["ordini", "paypal", "vendite", "recensioni", "rimborso", "utenti"].includes(m)) {
      const ok = await authUser(req, res);
      if (ok === false) return;
    }

    // esecuzione con timeout
    let result;
    try {
      result = await withTimeout(handler(req, res), 8000); // 8s
    } catch (e) {
      console.error("❌ ROUTER HANDLER TIMEOUT/ERROR:", m, f, e.message);
      return res.json({ success: false, error: "Timeout o errore interno" });
    }

    const payload = result || { success: false, error: "Risposta vuota" };
    return res.json(payload);

  } catch (err) {
    console.error("❌ ROUTER UNIVERSALE ERROR:", err);
    return res.json({ success: false, error: "Errore interno router" });
  } finally {
    const ms = Date.now() - started;
    if (ms > 1000) {
      console.warn("⏱️ ROUTER lento:", req.params.modulo, req.params.funzione, ms + "ms");
    }
  }
});

module.exports = router;
