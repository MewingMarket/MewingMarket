/* =========================================================
   ROUTER UNIVERSALE — HARDENED MODE 2051 (AGGRESSIVE)
   Protezione totale per TUTTI i moduli e funzioni
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
   CONFIG SICUREZZA AGGRESSIVA
========================================================= */

// regex nomi modulo/funzione
const NAME_REGEX = /^[a-z0-9_-]{1,40}$/i;

// moduli sensibili → rate limit più stretto
const SENSITIVE_MODULES = new Set([
  "admin", "paypal", "ordini", "vendite", "rimborso", "utenti"
]);

// moduli pubblici → rate limit medio
const PUBLIC_MODULES = new Set([
  "prodotti", "ai", "recensioni", "newsletter", "generico", "diagnostica"
]);

// rate limit globale
const RATE_LIMIT_WINDOW_MS = 10_000; // 10s
const RATE_LIMIT_MAX = 20;           // default
const RATE_LIMIT_PUBLIC = 10;        // moduli pubblici
const RATE_LIMIT_SENSITIVE = 5;      // moduli sensibili

// mappa rate limit
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
    console.warn("🛑 RATE LIMIT:", key, "count:", entry.count);
    res.status(429).json({ success: false, error: "Troppe richieste, riprova tra poco." });
    return false;
  }

  return true;
}

// timeout handler
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout handler")), ms))
  ]);
}

/* =========================================================
   ENDPOINT SPECIALI
========================================================= */

router.get("/js-list", jslist);
router.get("/ping", (req, res) => res.json({ ok: true, ts: Date.now() }));

/* =========================================================
   ROUTER UNIVERSALE HARDENED
========================================================= */

router.all("/:modulo/:funzione", async (req, res) => {
  const started = Date.now();

  try {
    let { modulo, funzione } = req.params;
    const m = String(modulo || "").toLowerCase();
    const f = String(funzione || "").toLowerCase();

    /* =========================================================
       VALIDAZIONE NOME MODULO/FUNZIONE
    ========================================================== */
    if (!NAME_REGEX.test(m) || !NAME_REGEX.test(f)) {
      console.warn("⚠️ ROUTER: nome modulo/funzione non valido:", m, f);
      return res.json({ success: false, error: "Endpoint non valido" });
    }

    /* =========================================================
       RATE LIMIT AGGRESSIVO
    ========================================================== */
    if (!checkRate(req, res, m, f)) return;

    /* =========================================================
       MODULO ESISTE?
    ========================================================== */
    const mod = funzioni[m];
    if (!mod) {
      console.warn("⚠️ ROUTER: modulo non trovato:", m);
      return res.json({ success: false, error: "Modulo non trovato" });
    }

    /* =========================================================
       FUNZIONE ESISTE?
    ========================================================== */
    let handler = mod[f];

    if (!handler && f === "getpublic") {
      handler = mod.getPublic || mod.getProductsPublic || mod.getProdotti;
    }

    if (typeof handler !== "function") {
      console.warn("⚠️ ROUTER: funzione non trovata:", m, f);
      return res.json({ success: false, error: "Funzione non trovata" });
    }

    /* =========================================================
       AUTENTICAZIONE
    ========================================================== */
    if (m === "admin") {
      const ok = await authAdmin(req, res);
      if (ok === false) return;
    }

    if (SENSITIVE_MODULES.has(m)) {
      const ok = await authUser(req, res);
      if (ok === false) return;
    }

    /* =========================================================
       ESECUZIONE HANDLER CON TIMEOUT 5s
    ========================================================== */
    let result;
    try {
      result = await withTimeout(handler(req, res), 5000);
    } catch (e) {
      console.error("❌ ROUTER HANDLER TIMEOUT/ERROR:", m, f, e.message);
      return res.json({ success: false, error: "Timeout o errore interno" });
    }

    /* =========================================================
       RISPOSTA
    ========================================================== */
    const payload = result || { success: false, error: "Risposta vuota" };
    return res.json(payload);

  } catch (err) {
    console.error("❌ ROUTER UNIVERSALE ERROR:", err);
    return res.json({ success: false, error: "Errore interno router" });
  } finally {
    const ms = Date.now() - started;
    if (ms > 800) {
      console.warn("⏱️ ROUTER lento:", req.params.modulo, req.params.funzione, ms + "ms");
    }
  }
});

module.exports = router;
