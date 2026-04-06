/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * Versione DEFINITIVA 2026.100 — PUBLIC/PRIVATE perfetto
 * PATCH: admin-feedback + admin-utenti + top recensioni
 * =========================================================
 */

const express = require("express");
const router = express.Router();

/* =========================================================
   1) ROTTE PUBBLICHE (NO TOKEN)
========================================================= */
router.use("/utenti", require("./routes/api-utenti.cjs"));

/* =========================================================
   ⭐ PATCH: TOP RECENSIONI (PUBLIC)
========================================================= */
try {
  router.use(require("./routes/api-recensioni-top.cjs"));
  console.log("🔥 api-recensioni-top.cjs CARICATO");
} catch (err) {
  console.error("❌ ERRORE CARICAMENTO api-recensioni-top:", err);
}

/* =========================================================
   2) ADMIN (protette da auth-admin)
   ⭐ PATCH: PRIMA DI auth-user
========================================================= */
const authAdmin = require("./middleware/auth-admin.cjs");
router.use("/admin", authAdmin);

/* =========================================================
   ADMIN DASHBOARD
========================================================= */
try {
  console.log("Tentativo load admin-dashboard...");
  const adminDashboard = require("./routes/admin-dashboard.cjs");
  router.use("/admin", adminDashboard);
  console.log("🔥 admin-dashboard CARICATO");
} catch (err) {
  console.error("❌ ERRORE CARICAMENTO admin-dashboard:", err);
}

/* =========================================================
   ⭐ PATCH: ADMIN FEEDBACK (LISTA COMPLETA)
========================================================= */
try {
  const adminFeedback = require("./routes/admin-feedback.cjs");
  router.use("/admin", adminFeedback);
  console.log("🔥 admin-feedback.cjs CARICATO");
} catch (err) {
  console.error("❌ ERRORE CARICAMENTO admin-feedback:", err);
}

/* =========================================================
   ⭐ PATCH: ADMIN UTENTI (LISTA + BLOCCO)
========================================================= */
try {
  const adminUtenti = require("./routes/admin-utenti.cjs");
  router.use("/admin", adminUtenti);
  console.log("🔥 admin-utenti.cjs CARICATO");
} catch (err) {
  console.error("❌ ERRORE CARICAMENTO admin-utenti:", err);
}

/* =========================================================
   3) MIDDLEWARE USER (TOKEN OBBLIGATORIO)
   Tutto ciò che segue richiede sessione valida
========================================================= */
router.use(require("./middleware/auth-user.cjs"));

/* =========================================================
   4) ROTTE UTENTE PROTETTE
========================================================= */
router.use(require("./routes/api-prodotti-new.cjs"));
router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/ordini-utente.cjs"));
router.use(require("./routes/api-feedback.cjs"));
router.use(require("./routes/api-vendite-download.cjs"));
router.use("/prodotti", require("./routes/prodotti-ai.cjs"));
/* =========================================================
   5) PAYPAL (PUBLIC)
========================================================= */
router.use(require("./routes/paypal-create.cjs"));
router.use(require("./routes/paypal-complete.cjs"));
router.use(require("./routes/paypal-cancel.cjs"));

module.exports = router;
