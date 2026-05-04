/* =========================================================
   ROUTER UNIVERSALE — Versione 2038 (FULL MERGE)
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
   ENDPOINT SPECIALI
========================================================= */

// /api/js-list → handler diretto
router.get("/js-list", jslist);

// /api/ping → diagnostica base
router.get("/ping", (req, res) => res.json({ ok: true, ts: Date.now() }));

/* =========================================================
   ROUTER MODULO/FUNZIONE
========================================================= */
router.all("/:modulo/:funzione", async (req, res) => {
  try {
    const { modulo, funzione } = req.params;
    const m = modulo.toLowerCase();
    const f = funzione.toLowerCase();

    const mod = funzioni[m];
    if (!mod) return res.json({ success: false, error: "Modulo non trovato" });

    let handler = mod[f];

    if (!handler && f === "getpublic") {
      handler = mod.getPublic || mod.getProductsPublic || mod.getProdotti;
    }

    if (typeof handler !== "function") {
      return res.json({ success: false, error: "Funzione non trovata" });
    }

    if (m === "admin") {
      const ok = await authAdmin(req, res);
      if (ok === false) return;
    }

    if (["ordini", "paypal", "vendite", "recensioni", "rimborso", "utenti"].includes(m)) {
      const ok = await authUser(req, res);
      if (ok === false) return;
    }

    const result = await handler(req, res);
    return res.json(result || { success: false, error: "Risposta vuota" });

  } catch (err) {
    console.error("❌ ROUTER UNIVERSALE ERROR:", err);
    return res.json({ success: false, error: "Errore interno router" });
  }
});

module.exports = router;
