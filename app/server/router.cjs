/* =========================================================
   ROUTER UNIVERSALE — Versione 2027.9 + PATCH getPublic
========================================================= */

const express = require("express");
const router = express.Router();

const funzioni = require("./index.cjs");

const R = (p) => require(require("path").join(process.cwd(), "app/server", p));
const authUser = R("middleware/auth-user.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

/* =========================================================
   /api/<modulo>/<funzione>
========================================================= */

router.all("/:modulo/:funzione", async (req, res) => {
  try {
    const { modulo, funzione } = req.params;

    const mod = funzioni[modulo];
    if (!mod) {
      return res.status(404).json({ success: false, error: "Modulo non trovato" });
    }

    let handler = mod[funzione];

    /* =========================================================
       🔵 PATCH UNIVERSALE — getPublic fallback
       Se la funzione non esiste e la richiesta è getPublic,
       prova automaticamente le funzioni pubbliche disponibili.
    ========================================================== */
    if (!handler && funzione === "getPublic") {
      handler = async (req) => {

        // 1) Se il modulo ha già una getPublic → usa quella
        if (typeof mod.getPublic === "function") {
          return await mod.getPublic(req);
        }

        // 2) Se esiste getProductsPublic → usa quella
        if (typeof mod.getProductsPublic === "function") {
          return await mod.getProductsPublic(req);
        }

        // 3) Se esiste getProdotti → usa quella
        if (typeof mod.getProdotti === "function") {
          return await mod.getProdotti(req);
        }

        // 4) Nessuna funzione pubblica trovata
        return { success: false, error: "Funzione getPublic non disponibile" };
      };
    }
    /* ========================================================= */

    if (typeof handler !== "function") {
      return res.status(404).json({ success: false, error: "Funzione non trovata" });
    }

    // Autenticazione automatica
    if (modulo === "admin") {
      const ok = await authAdmin(req, res);
      if (ok === false) return;
    }

    if (["ordini", "paypal", "vendite", "recensioni", "rimborso", "utenti"].includes(modulo)) {
      const ok = await authUser(req, res);
      if (ok === false) return;
    }

    const result = await handler(req, res);
    return res.json(result);

  } catch (err) {
    console.error("❌ ROUTER ERROR:", err);
    return res.status(500).json({ success: false, error: "Errore interno" });
  }
});

module.exports = router;
