/* =========================================================
   ROUTER PRINCIPALE — Versione PERFETTA 2027.8
   SENZA /api — server.cjs lo aggiunge già
========================================================= */

const express = require("express");
const path = require("path");
const router = express.Router();

const R = (p) => require(path.join(process.cwd(), "app/server", p));

/* =========================================================
   1) API PUBBLICHE
========================================================= */

// Prodotti pubblici
router.use(R("routes/api-prodotti-new.cjs"));     // /products, /prodotti
router.use(R("routes/product-page.cjs"));         // /product-page/:id

// Health & System Status
router.use(R("routes/api-health.cjs"));
router.use(R("routes/system-status.cjs"));

// Assistenza pubblica
router.use(R("routes/api-assistenza.cjs"));

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

// Utente (FILE REALE: api-utenti.cjs)
router.use("/utente", authUser, R("routes/api-utenti.cjs"));

/* =========================================================
   4) ORDINI, DOWNLOAD, RECENSIONI, RIMBORSO
========================================================= */

router.use("/ordini", authUser, R("routes/ordini-utente.cjs"));
router.use("/vendite", authUser, R("routes/api-vendite-download.cjs"));
router.use("/recensioni", authUser, R("routes/api-feedback.cjs"));
router.use("/rimborso", authUser, R("routes/rimborso.cjs"));

/* =========================================================
   5) FAILSAFE
========================================================= */
router.use((err, req, res, next) => {
  console.error("❌ [ROUTER ERROR]:", req.path, err.message);
  res.status(500).json({ success: false, error: "Errore interno del server" });
});

module.exports = router;
