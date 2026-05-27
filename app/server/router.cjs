// =========================================================
// ROUTER UNIVERSALE — VERSIONE LAZY 2060
// =========================================================

const express = require("express");
const router = express.Router();
const path = require("path");

// Caricamento LAZY dell’indice
const lazyIndex = require("./index.lazy.cjs");

// Caricamento LAZY dei middleware
const loadAuthUser = () => require(path.join(process.cwd(), "app/server/middleware/auth-user.cjs"));
const loadAuthAdmin = () => require(path.join(process.cwd(), "app/server/middleware/auth-admin.cjs"));

function resolveHandler(mod, rawName) {
  if (!mod) return null;
  const keys = Object.keys(mod);
  const reqLower = rawName.toLowerCase();

  if (typeof mod[rawName] === "function") return mod[rawName];

  const ci = keys.find(k => k.toLowerCase() === reqLower);
  if (ci) return mod[ci];

  const prefix = keys.find(k => k.toLowerCase().startsWith(reqLower));
  if (prefix) return mod[prefix];

  const contains = keys.find(k => k.toLowerCase().includes(reqLower));
  if (contains) return mod[contains];

  return null;
}

async function runAuth(m, req, res) {
  try {
    if (m === "admin") {
      const authAdmin = loadAuthAdmin();
      return new Promise(resolve => authAdmin(req, res, () => resolve(true)));
    }

    if (["utenti", "ordini", "vendite", "rimborso"].includes(m)) {
      const authUser = loadAuthUser();
      return new Promise(resolve => authUser(req, res, () => resolve(true)));
    }

    return true;
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return true;
  }
}

router.all("/:modulo/:funzione", async (req, res) => {
  try {
    const m = req.params.modulo.toLowerCase();
    const f = req.params.funzione;

    const loaders = lazyIndex[m];
    if (!loaders) return res.json({ success: false, error: "Modulo non trovato" });

    // Caricamento LAZY del modulo
    let mod = {};
    for (const load of loaders) {
      const part = await load();
      Object.assign(mod, part);
    }

    const handler = resolveHandler(mod, f);
    if (!handler) return res.json({ success: false, error: "Funzione non trovata" });

    // AUTH
    await runAuth(m, req, res);
    if (res.headersSent) return;

    // ESECUZIONE HANDLER
    const out = handler(req, res);
    const result = out instanceof Promise ? await out : out;

    if (res.headersSent) return;

    if (result !== undefined) {
      return res.json(result);
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("ROUTER ERROR:", err);
    if (!res.headersSent) {
      return res.json({ success: false, error: "Errore interno router" });
    }
  }
});

module.exports = router;
