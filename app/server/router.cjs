/* =========================================================
   ROUTER UNIVERSALE — Versione 2028.100 (FULL NORMALIZATION)
   - Case-insensitive per modulo e funzione
   - Compatibile con universal-json
   - Nessun ERR_HTTP_HEADERS_SENT
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
       1) NORMALIZZAZIONE MODULO (case-insensitive)
    ===================================================== */
    const m = modulo;
    const modCandidates = [
      m,
      m.toLowerCase(),
      m.toUpperCase(),
      m.charAt(0).toLowerCase() + m.slice(1),
      m.charAt(0).toUpperCase() + m.slice(1)
    ];

    let mod = null;
    for (const c of modCandidates) {
      if (funzioni[c]) {
        mod = funzioni[c];
        break;
      }
    }

    if (!mod) {
      return res.json({ success: false, error: "Modulo non trovato" });
    }

    /* =====================================================
       2) NORMALIZZAZIONE FUNZIONE (case-insensitive)
    ===================================================== */
    const f = funzione;

    const fnCandidates = [
      f,
      f.toLowerCase(),
      f.toUpperCase(),
      f.charAt(0).toLowerCase() + f.slice(1),
      f.charAt(0).toUpperCase() + f.slice(1)
    ];

    let handler = null;
    for (const c of fnCandidates) {
      if (typeof mod[c] === "function") {
        handler = mod[c];
        break;
      }
    }

    /* =====================================================
       3) PATCH getPublic UNIVERSALE
    ===================================================== */
    if (!handler && f.toLowerCase() === "getpublic") {
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
       4) AUTENTICAZIONE AUTOMATICA
    ===================================================== */

    // ADMIN
    if (modulo.toLowerCase() === "admin") {
      const ok = await authAdmin(req, res);
      if (ok === false) return;
    }

    // UTENTE
    if (["ordini", "paypal", "vendite", "recensioni", "rimborso", "utenti"]
      .includes(modulo.toLowerCase())) {
      const ok = await authUser(req, res);
      if (ok === false) return;
    }

    /* =====================================================
       5) ESECUZIONE FUNZIONE
    ===================================================== */
    let result;
    try {
      result = await handler(req, res);
    } catch (err) {
      console.error("❌ ERRORE HANDLER:", err);
      return res.json({ success: false, error: "Errore interno handler" });
    }

    /* =====================================================
       6) RISPOSTA UNIVERSALE
    ===================================================== */
    return res.json(result || { success: false, error: "Risposta vuota" });

  } catch (err) {
    console.error("❌ ROUTER ERROR:", err);
    return res.json({ success: false, error: "Errore interno router" });
  }
});

module.exports = router;
