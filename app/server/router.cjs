/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * =========================================================
 */

const express = require("express");
const router = express.Router();

// ===============================
// 1) ROTTE PUBBLICHE (NO TOKEN)
// ===============================
const apiUtenti = require("./routes/api-utenti.cjs");

// Registrazione e login devono essere pubbliche
router.post("/utenti/registrazione", apiUtenti);
router.post("/utenti/login", apiUtenti);

// ===============================
// 2) MIDDLEWARE USER (TOKEN OBBLIGATORIO)
// ===============================
router.use(require("./middleware/auth-user.cjs"));

// ===============================
// 3) ROTTE UTENTE PROTETTE
// ===============================
router.use(require("./routes/api-prodotti-new.cjs"));
router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/ordini-utente.cjs"));
router.use(require("./routes/api-feedback.cjs"));
router.use(require("./routes/api-vendite-download.cjs"));

// ===============================
// 4) PAYPAL
// ===============================
router.use(require("./routes/paypal-create.cjs"));
router.use(require("./routes/paypal-complete.cjs"));
router.use(require("./routes/paypal-cancel.cjs"));

// ===============================
// 5) ADMIN (protette da auth-admin)
// ===============================
router.use(require("./middleware/auth-admin.cjs"));
router.use(require("./routes/admin-analytics.cjs"));
router.use(require("./routes/vendite-admin.cjs"));

module.exports = router;
