/* =========================================================
   ROUTER PRINCIPALE — Versione PERFETTA 2027.4
   SENZA /api — tutto diretto
========================================================= */

const express = require("express");
const path = require("path");
const router = express.Router();

const R = (p) => require(path.join(process.cwd(), "app/server", p));

/* =========================================================
   1) API PUBBLICHE (NON protette)
========================================================= */

// Prodotti pubblici
router.use(R("routes/api-prodotti-new.cjs"));     // /prodotti, /products
router.use(R("routes/product-page.cjs"));         // /product-page/:id

// Health & System Status
router.use(R("routes/api-health.cjs"));           // /health
router.use(R("routes/system-status.cjs"));        // /system-status

// Assistenza pubblica
router.use(R("routes/api-assistenza.cjs"));       // /assistenza/invia

/* =========================================================
   2) ADMIN (protetto da auth-admin)
========================================================= */
router.use("/admin", R("routes/api-admin.cjs"));
router.use("/admin", R("routes/admin-dashboard.cjs"));
router.use("/admin", R("routes/admin-feedback.cjs"));
router.use("/admin", R("routes/admin-utenti.cjs"));

/* =========================================================
   3) API PRIVATE UTENTE (protette da auth-user)
========================================================= */

const authUser = R("middleware/auth-user.cjs");

// Utente
router.use("/utente", authUser, R("routes/api-utente.cjs"));

// Ordini
router.use("/ordini", authUser, R("routes/ordini-utente.cjs"));

// Download
router.use("/vendite", authUser, R("routes/api-vendite-download.cjs"));

// Recensioni
router.use("/recensioni", authUser, R("routes/api-feedback.cjs"));

// Rimborso
router.use("/rimborso", authUser, R("routes/rimborso.cjs"));

/* =========================================================
   4) FAILSAFE
========================================================= */
router.use((err, req, res, next) => {
  console.error("❌ [ROUTER ERROR]:", req.path, err.message);
  res.status(500).json({ success: false, error: "Errore interno del server" });
});

module.exports = router;
