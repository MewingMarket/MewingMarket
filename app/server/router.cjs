/* =========================================================
   ROUTER UNIVERSALE — Versione 2027.901 (SAFE + UNIVERSALE)
   - Compatibile con universal-json
   - Nessun ERR_HTTP_HEADERS_SENT
   - Nessun next() senza return
   - Autenticazione robusta
   - Fallback getPublic migliorato
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
    const cleanPath = (req.originalUrl || req.url || "").toLowerCase();

    console.log("🔵 ROUTER UNIVERSALE →", cleanPath);

    /* =====================================================
       1) CARICAMENTO MODULO
    ===================================================== */
    const mod = funzioni[modulo];
    if (!mod) {
      return res.json({ success: false, error: "Modulo non trovato" });
    }

    let handler = mod[funzione];

    /* =====================================================
       2) PATCH getPublic UNIVERSALE
    ===================================================== */
    if (!handler && funzione === "getpublic") {
      handler = async (req) => {
        if (typeof mod.getPublic === "function") return await mod.getPublic(req);
        if (typeof mod.getProductsPublic === "function") return await mod.getProductsPublic(req);
        if (typeof mod.getProdotti === "function") return await mod.getProdotti(req);

        return { success: false, error: "Funzione getPublic non disponibile" };
      };
    }

    if (typeof handler !== "function") {
      return res.json({ success: false, error: "Funzione non trovata" });
    }

    /* =====================================================
       3) AUTENTICAZIONE AUTOMATICA
    ===================================================== */

    // ADMIN
    if (modulo === "admin") {
      const ok = await authAdmin(req, res);
      if (ok === false) return; // STOP
    }

    // UTENTE
    if (["ordini", "paypal", "vendite", "recensioni", "rimborso", "utenti"].includes(modulo)) {
      const ok = await authUser(req, res);
      if (ok === false) return; // STOP
    }

    /* =====================================================
       4) ESECUZIONE FUNZIONE
    ===================================================== */
    let result;
    try {
      result = await handler(req, res);
    } catch (err) {
      console.error("❌ ERRORE HANDLER:", err);
      return res.json({ success: false, error: "Errore interno handler" });
    }

    /* =====================================================
       5) RISPOSTA UNIVERSALE
       (universal-json intercetterà e normalizzerà)
    ===================================================== */
    return res.json(result || { success: false, error: "Risposta vuota" });

  } catch (err) {
    console.error("❌ ROUTER ERROR:", err);
    return res.json({ success: false, error: "Errore interno router" });
  }
});

module.exports = router;
