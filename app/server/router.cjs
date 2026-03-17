/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * =========================================================
 */

const express = require("express");
const router = express.Router();

// API UTENTE (SQL)
router.use(require("./routes/api-prodotti-new.cjs"));
router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/api-utenti.cjs"));
router.use(require("./routes/ordini-utente.cjs"));          // ✔ nome reale
router.use(require("./routes/api-feedback.cjs"));
router.use(require("./routes/api-vendite-download.cjs"));   // ✔ aggiunto

// PAYPAL (nomi reali)
router.use(require("./routes/paypal-create.cjs"));
router.use(require("./routes/paypal-complete.cjs"));
router.use(require("./routes/paypal-cancel.cjs"));

// ADMIN API (NUOVE)
router.use(require("./routes/admin-analytics.cjs"));         // 🔥 PATCH QUI
router.use(require("./routes/vendite-admin.cjs"));           // ✔ aggiunto

module.exports = router;
