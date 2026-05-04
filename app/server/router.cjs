/* =========================================================
   ROUTER UNIVERSALE FINALE — Versione 2038
   - Gestisce endpoint speciali (js-list, ping, ecc.)
   - Gestisce /api/<modulo>/<funzione>
   - Nessun conflitto, nessun ordine da rispettare
========================================================= */

const express = require("express");
const router = express.Router();
const path = require("path");

const funzioni = require("./index.cjs");

// Router speciali
const jslist = require("./routes/jslist.cjs");

// Middleware auth
const R = (p) => require(path.join(process.cwd(), "app/server", p));
const authUser = R("middleware/auth-user.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

/* =========================================================
   1) ENDPOINT SPECIALI (match immediato)
========================================================= */

// js-list
router.get("/js-list", jslist);

// ping (fallback)
router.get("/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* =========================================================
   2) ROUTER MODULO/FUNZIONE
========================================================= */

router.all("/:modulo/:funzione", async (req, res) => {
  try {
    const { modulo, funzione } = req.params;

    /* ---------------------------------------------
       Normalizzazione modulo
    --------------------------------------------- */
    const m = modulo.toLowerCase();
    const mod = funzioni[m];

    if (!mod) {
      return res.json({ success: false, error: "Modulo non trovato" });
    }

    /* ---------------------------------------------
       Normalizzazione funzione
    --------------------------------------------- */
    const f = funzione.toLowerCase();
    let handler = mod[f];

    // fallback getPublic
    if (!handler && f === "getpublic") {
      handler = mod.getPublic || mod.getProductsPublic || mod.getProdotti;
    }

    if (typeof handler !== "function") {
      return res.json({ success: false, error: "Funzione non trovata" });
    }

    /* ---------------------------------------------
       Autenticazione automatica
    --------------------------------------------- */
    if (m === "admin") {
      const ok = await authAdmin(req, res);
      if (ok === false) return;
    }

    if (["ordini", "paypal", "vendite", "recensioni", "rimborso", "utenti"]
      .includes(m)) {
      const ok = await authUser(req, res);
      if (ok === false) return;
    }

    /* ---------------------------------------------
       Esecuzione
    --------------------------------------------- */
    const result = await handler(req, res);
    return res.json(result || { success: false, error: "Risposta vuota" });

  } catch (err) {
    console.error("❌ ROUTER UNIVERSALE ERROR:", err);
    return res.json({ success: false, error: "Errore interno router" });
  }
});

module.exports = router;
