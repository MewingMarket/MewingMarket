/* =========================================================
   ROUTER PRINCIPALE — Versione PERFETTA 2027.5
   TUTTO sotto /api
========================================================= */

const express = require("express");
const path = require("path");
const router = express.Router();

const R = (p) => require(path.join(process.cwd(), "app/server", p));

/* =========================================================
   1) API PUBBLICHE
========================================================= */

// Prodotti pubblici
router.use("/api", R("routes/api-prodotti-new.cjs"));     // /api/products, /api/prodotti
router.use("/api", R("routes/product-page.cjs"));         // /api/product-page/:id

// Health & System Status
router.use("/api", R("routes/api-health.cjs"));
router.use("/api", R("routes/system-status.cjs"));

// Assistenza pubblica
router.use("/api", R("routes/api-assistenza.cjs"));

/* =========================================================
   2) ADMIN (protetto da auth-admin)
========================================================= */
router.use("/api/admin", R("routes/api-admin.cjs"));
router.use("/api/admin", R("routes/admin-dashboard.cjs"));
router.use("/api/admin", R("routes/admin-feedback.cjs"));
router.use("/api/admin", R("routes/admin-utenti.cjs"));

/* =========================================================
   3) API PRIVATE UTENTE (protette da auth-user)
========================================================= */

const authUser = R("middleware/auth-user.cjs");

// Utente
router.use("/api/utente", authUser, R("routes/api-utente.cjs"));

// Ordini
router.use("/api/ordini", authUser, R("routes/ordini-utente.cjs"));

// Download
router.use("/api/vendite", authUser, R("routes/api-vendite-download.cjs"));

// Recensioni
router.use("/api/recensioni", authUser, R("routes/api-feedback.cjs"));

// Rimborso
router.use("/api/rimborso", authUser, R("routes/rimborso.cjs"));

/* =========================================================
   4) FAILSAFE
========================================================= */
router.use((err, req, res, next) => {
  console.error("❌ [ROUTER ERROR]:", req.path, err.message);
  res.status(500).json({ success: false, error: "Errore interno del server" });
});

module.exports = router;
