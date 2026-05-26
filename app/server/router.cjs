// =========================================================
// ROUTER UNIVERSALE — VERSIONE INTELLIGENTE 2053
// Compatibile con:
// - handler che usano res.json()
// - handler che ritornano oggetti
// - handler async
// - handler sync
// - fuzzy matching
// - index.cjs gigante
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

  // match diretto
  if (typeof mod[rawName] === "function") return mod[rawName];

  // case-insensitive
  const ci = keys.find(k => k.toLowerCase() === reqLower);
  if (ci) return mod[ci];

  // prefix
  const prefix = keys.find(k => k.toLowerCase().startsWith(reqLower));
  if (prefix) return mod[prefix];

  // contains
  const contains = keys.find(k => k.toLowerCase().includes(reqLower));
  if (contains) return mod[contains];

  return null;
}

router.all("/:modulo/:funzione", async (req, res) => {
  try {
    const m = req.params.modulo.toLowerCase();
    const f = req.params.funzione;

    const mod = funzioni[m];
    if (!mod) return res.json({ success: false, error: "Modulo non trovato" });

    const handler = resolveHandler(mod, f);
    if (!handler) return res.json({ success: false, error: "Funzione non trovata" });

    // AUTH
    if (m === "admin") await authAdmin(req, res, () => {});
    if (["utenti", "ordini", "vendite", "rimborso"].includes(m)) {
      await authUser(req, res, () => {});
    }

    // Se l'handler ha già risposto → STOP
    if (res.headersSent) return;

    // Esegui handler
    const out = handler(req, res);

    // Se l'handler è async → aspetta
    const result = out instanceof Promise ? await out : out;

    // Se ha già risposto → STOP
    if (res.headersSent) return;

    // Se ritorna un oggetto → rispondi tu
    if (result !== undefined) {
      return res.json(result);
    }

    // Altrimenti → risposta di default
    return res.json({ success: true });

  } catch (err) {
    console.error("ROUTER ERROR:", err);
    if (!res.headersSent) {
      return res.json({ success: false, error: "Errore interno router" });
    }
  }
});

module.exports = router;
