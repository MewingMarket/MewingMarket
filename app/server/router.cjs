/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * Versione DEFINITIVA 2026.200 — require assoluti
 * =========================================================
 */

const express = require("express");
const path = require("path");
const router = express.Router();

/* Helper per require assoluti */
const R = (p) => require(path.join(process.cwd(), "app/server", p));

/* =========================================================
   1) ROTTE PUBBLICHE (NO TOKEN)
========================================================= */
router.use("/utenti", R("routes/api-utenti.cjs"));

/* =========================================================
   ⭐ PATCH: TOP RECENSIONI (PUBLIC)
========================================================= */
try {
  router.use(R("routes/api-recensioni-top.cjs"));
  console.log("🔥 api-recensioni-top.cjs CARICATO");
} catch (err) {
  console.error("❌ ERRORE CARICAMENTO api-recensioni-top:", err);
}

/* =========================================================
   2) ADMIN (protette da auth-admin)
   ⭐ PATCH: PRIMA DI auth-user
========================================================= */
const authAdmin = R("middleware/auth-admin.cjs");
router.use("/admin", authAdmin);

/* =========================================================
   ADMIN DASHBOARD
========================================================= */
try {
  console.log("Tentativo load admin-dashboard...");
  const adminDashboard = R("routes/admin-dashboard.cjs");
  router.use("/admin", adminDashboard);
  console.log("🔥 admin-dashboard CARICATO");
} catch (err) {
  console.error("❌ ERRORE CARICAMENTO admin-dashboard:", err);
}

/* =========================================================
   ⭐ PATCH: ADMIN FEEDBACK (LISTA COMPLETA)
========================================================= */
try {
  const adminFeedback = R("routes/admin-feedback.cjs");
  router.use("/admin", adminFeedback);
  console.log("🔥 admin-feedback.cjs CARICATO");
} catch (err) {
  console.error("❌ ERRORE CARICAMENTO admin-feedback:", err);
}

/* =========================================================
   ⭐ PATCH: ADMIN UTENTI (LISTA + BLOCCO)
========================================================= */
try {
  const adminUtenti = R("routes/admin-utenti.cjs");
  router.use("/admin", adminUtenti);
  console.log("🔥 admin-utenti.cjs CARICATO");
} catch (err) {
  console.error("❌ ERRORE CARICAMENTO admin-utenti:", err);
}

/* =========================================================
   3) MIDDLEWARE USER (TOKEN OBBLIGATORIO)
========================================================= */
router.use(R("middleware/auth-user.cjs"));

/* =========================================================
   4) ROTTE UTENTE PROTETTE
========================================================= */
router.use(R("routes/api-prodotti-new.cjs"));
router.use(R("routes/api-upload.cjs"));
router.use(R("routes/ordini-utente.cjs"));
router.use(R("routes/api-feedback.cjs"));
router.use(R("routes/api-vendite-download.cjs"));
router.use("/prodotti", R("routes/prodotti-ai.cjs"));

/* =========================================================
   5) PAYPAL (PUBLIC)
========================================================= */
router.use(R("routes/paypal-create.cjs"));
router.use(R("routes/paypal-complete.cjs"));
router.use(R("routes/paypal-cancel.cjs"));

module.exports = router;
