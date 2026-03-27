/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * Versione DEFINITIVA 2026 — PUBLIC/PRIVATE perfetto
 * =========================================================
 */

const express = require("express");
const router = express.Router();

// =========================================================
// 1) ROTTE PUBBLICHE (NO TOKEN)
//    Login, registrazione, reset password/email
// =========================================================
router.use("/utenti", require("./routes/api-utenti.cjs"));

// =========================================================
// 2) MIDDLEWARE USER (TOKEN OBBLIGATORIO)
//    Tutto ciò che segue richiede sessione valida
// =========================================================
router.use(require("./middleware/auth-user.cjs"));

// =========================================================
// 3) ROTTE UTENTE PROTETTE (richiedono token user)
// =========================================================
router.use(require("./routes/api-prodotti-new.cjs"));
router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/ordini-utente.cjs"));
router.use(require("./routes/api-feedback.cjs"));
router.use(require("./routes/api-vendite-download.cjs"));

// =========================================================
// 4) PAYPAL (PUBLIC)
//    ⚠️ PayPal NON deve essere protetto da token
// =========================================================
router.use(require("./routes/paypal-create.cjs"));
router.use(require("./routes/paypal-complete.cjs"));
router.use(require("./routes/paypal-cancel.cjs"));

// =========================================================
// 5) ADMIN (protette da auth-admin)
//    ⚠️ SOLO /admin deve essere protetto
// =========================================================
const authAdmin = require("./middleware/auth-admin.cjs");

router.use("/admin", authAdmin);

// ⭐⭐⭐ PATCH CRITICA — AGGIUNTA LA ROUTE MANCANTE ⭐⭐⭐
router.use("/admin", require("./routes/api-admin.cjs"));

router.use("/admin", require("./routes/admin-analytics.cjs"));
router.use("/admin", require("./routes/vendite-admin.cjs"));

module.exports = router;
