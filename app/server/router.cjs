/* =========================================================
   Router principale — Versione PERFETTA 2027
   - API PUBBLICHE prima
   - auth-user SOLO per le API private
   - Admin protetto
   - Prodotti pubblici
   - Nessun conflitto, nessuna pagina vuota
========================================================= */

const express = require("express");
const path = require("path");
const router = express.Router();

const R = (p) => require(path.join(process.cwd(), "app/server", p));

/* =========================================================
   1) DIAGNOSTICA (sempre in alto)
========================================================= */
try {
  const diagnostica = R("diagnostica.cjs");
  if (typeof diagnostica?.hookRouter === "function") diagnostica.hookRouter(router);
} catch (err) {}

/* =========================================================
   2) API PUBBLICHE (NON devono passare da auth-user)
========================================================= */

// Prodotti pubblici (catalogo + product-page)
router.use(R("routes/api-prodotti-new.cjs"));     // /api/products, /api/prodotti
router.use(R("routes/product-page.cjs"));         // /api/product-page/:id

// Health & System Status (pubbliche)
router.use(R("routes/api-health.cjs"));           // /api/health
router.use(R("routes/system-status.cjs"));        // /api/system-status

// Assistenza pubblica (invio messaggi)
router.use(R("routes/api-assistenza.cjs"));       // /api/assistenza/invia

/* =========================================================
   3) MIDDLEWARE IDENTITÀ (SOLO da qui in poi)
========================================================= */
router.use(R("middleware/auth-user.cjs"));

/* =========================================================
   4) API PRIVATE (richiedono token)
========================================================= */

// Dashboard Admin
router.use(R("routes/admin-dashboard.cjs"));

// Admin feedback
router.use(R("routes/admin-feedback.cjs"));

// Admin utenti
router.use(R("routes/admin-utenti.cjs"));

// Ordini utente (privati)
router.use(R("routes/ordini-utente.cjs"));

// Download vendite (privato)
router.use(R("routes/api-vendite-download.cjs"));

/* =========================================================
   5) FAILSAFE
========================================================= */
router.use((err, req, res, next) => {
  console.error("❌ [ROUTER ERROR]:", req.path, err.message);
  res.status(500).json({ success: false, error: "Errore interno del server" });
});

module.exports = router;
