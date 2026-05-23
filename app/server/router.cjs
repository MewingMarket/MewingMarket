/* =========================================================
   ROUTER UNIVERSALE — FUZZY MODE 2052.1 (PATCH COMPLETA)
   - FIX: middleware Express → wrapper Promise
   - FIX: next() non definito
   - FIX: compatibilità auth-user 2027.502
   - Nessuna modifica ai moduli / frontend
========================================================= */

const express = require("express");
const router = express.Router();
const path = require("path");
const funzioni = require("./index.cjs");

const R = (p) => require(path.join(process.cwd(), "app/server", p));
const authUser = R("middleware/auth-user.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

// jslist è un modulo con più funzioni, non un handler singolo
const jslist = require("./routes/jslist.cjs");

/* =========================================================
   WRAPPER PER MIDDLEWARE EXPRESS
========================================================= */
function runMiddleware(mw, req, res) {
  return new Promise((resolve) => {
    try {
      mw(req, res, (result) => resolve(result));
    } catch (err) {
      console.error("❌ Middleware error:", err);
      resolve(false);
    }
  });
}

/* =========================================================
   CONFIG
========================================================= */

const NAME_REGEX = /^[a-z0-9_-]{1,80}$/i;

const SENSITIVE_MODULES = new Set([
  "admin", "paypal", "ordini", "vendite", "rimborso", "utenti"
]);

/* =========================================================
   HELPER: fuzzy-match funzione dentro un modulo
========================================================= */

function resolveHandler(mod, rawName) {
  if (!mod || typeof mod !== "object") return null;
  if (!rawName) return null;

  const keys = Object.keys(mod);
  if (!keys.length) return null;

  const requested = String(rawName);
  const requestedLower = requested.toLowerCase();

  // 1) match diretto
  if (typeof mod[requested] === "function") {
    return { name: requested, fn: mod[requested] };
  }

  // 2) match case-insensitive esatto
  const exactCI = keys.find(k => k.toLowerCase() === requestedLower);
  if (exactCI && typeof mod[exactCI] === "function") {
    return { name: exactCI, fn: mod[exactCI] };
  }

  // 3) camelCase variante
  const camelVariant = requested.charAt(0).toLowerCase() + requested.slice(1);
  if (typeof mod[camelVariant] === "function") {
    return { name: camelVariant, fn: mod[camelVariant] };
  }

  // 4) prefix match
  const prefix = keys.find(k => k.toLowerCase().startsWith(requestedLower));
  if (prefix && typeof mod[prefix] === "function") {
    return { name: prefix, fn: mod[prefix] };
  }

  // 5) contains match
  const contains = keys.find(k => k.toLowerCase().includes(requestedLower));
  if (contains && typeof mod[contains] === "function") {
    return { name: contains, fn: mod[contains] };
  }

  // 6) fallback specifico
  if (requestedLower === "getpublic") {
    const candidates = [
      "getPublic",
      "getProductsPublic",
      "getProdotti",
      "getProducts"
    ];
    for (const c of candidates) {
      if (typeof mod[c] === "function") {
        return { name: c, fn: mod[c] };
      }
    }
  }

  return null;
}

/* =========================================================
   ENDPOINT SPECIALI
========================================================= */

router.get("/ping", (req, res) => res.json({ ok: true, ts: Date.now() }));

if (typeof jslist.getPublicList === "function") {
  router.get("/js-list", (req, res) => jslist.getPublicList(req, res));
}

/* =========================================================
   ROUTER UNIVERSALE FUZZY
========================================================= */

router.all("/:modulo/:funzione", async (req, res) => {
  const started = Date.now();

  try {
    const { modulo, funzione } = req.params;

    const m = String(modulo || "").toLowerCase();
    const f = String(funzione || "");

    if (!NAME_REGEX.test(m) || !NAME_REGEX.test(f)) {
      console.warn("⚠️ ROUTER: nome modulo/funzione non valido:", m, f);
      return res.json({ success: false, error: "Endpoint non valido" });
    }

    const mod = funzioni[m];
    if (!mod) {
      console.warn("⚠️ ROUTER: modulo non trovato:", m);
      return res.json({ success: false, error: "Modulo non trovato" });
    }

    const resolved = resolveHandler(mod, f);
    if (!resolved) {
      console.warn("⚠️ ROUTER: funzione non trovata (anche fuzzy):", m, f);
      return res.json({ success: false, error: "Funzione non trovata" });
    }

    const handler = resolved.fn;

    /* =====================================================
       AUTH ADMIN
    ===================================================== */
    if (m === "admin") {
      const ok = await runMiddleware(authAdmin, req, res);
      if (ok === false) return;
    }

    /* =====================================================
       AUTH USER
    ===================================================== */
    if (SENSITIVE_MODULES.has(m)) {
      const ok = await runMiddleware(authUser, req, res);
      if (ok === false) return;
    }

    /* =====================================================
       ESECUZIONE HANDLER
    ===================================================== */
    let result;
    try {
      const maybePromise = handler(req, res);
      result = maybePromise instanceof Promise ? await maybePromise : maybePromise;
    } catch (e) {
      console.error("❌ ROUTER HANDLER ERROR:", m, f, "→", e);
      return res.json({ success: false, error: "Errore interno handler" });
    }

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
