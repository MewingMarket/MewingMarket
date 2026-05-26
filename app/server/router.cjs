// =========================================================
// ROUTER UNIVERSALE — VERSIONE INTELLIGENTE 2053 FIX
// =========================================================

const express = require("express");
const router = express.Router();
const path = require("path");
const funzioni = require("./index.cjs");

const R = (p) => require(path.join(process.cwd(), "app/server", p));
const authUser = R("middleware/auth-user.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

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
  return new Promise(resolve => {
    try {
      if (m === "admin") {
        authAdmin(req, res, () => resolve(true));
      } else if (["utenti", "ordini", "vendite", "rimborso"].includes(m)) {
        authUser(req, res, () => resolve(true));
      } else {
        resolve(true);
      }
    } catch (e) {
      console.error("AUTH ERROR:", e);
      resolve(true);
    }
  });
}

router.all("/:modulo/:funzione", async (req, res) => {
  try {
    const m = req.params.modulo.toLowerCase();
    const f = req.params.funzione;

    const mod = funzioni[m];
    if (!mod) return res.json({ success: false, error: "Modulo non trovato" });

    const handler = resolveHandler(mod, f);
    if (!handler) return res.json({ success: false, error: "Funzione non trovata" });

    // AUTH FIX
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
