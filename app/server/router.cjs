/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * Versione DEFINITIVA 2026.99 — PUBLIC/PRIVATE perfetto
 * =========================================================
 */

const express = require("express");
const router = express.Router();

/* =========================================================
   1) ROTTE PUBBLICHE (NO TOKEN)
========================================================= */
router.use("/utenti", require("./routes/api-utenti.cjs"));

/* =========================================================
   2) ADMIN (protette da auth-admin)
   ⭐ PATCH: PRIMA DI auth-user
========================================================= */
const authAdmin = require("./middleware/auth-admin.cjs");
router.use("/admin", authAdmin);
router.use("/admin", require("./routes/admin-dashboard.cjs"));

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

/* =========================================================
   5) PAYPAL (PUBLIC)
========================================================= */
router.use(require("./routes/paypal-create.cjs"));
router.use(require("./routes/paypal-complete.cjs"));
router.use(require("./routes/paypal-cancel.cjs"));

module.exports = router;
