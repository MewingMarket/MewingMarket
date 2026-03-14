/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * =========================================================
 */

const express = require("express");
const router = express.Router();

// API UTENTE (SQL)
router.use(require("./routes/api-prodotti.cjs"));

router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/api-utenti.cjs"));

router.use(require("./routes/api-ordini-utente.cjs"));


// API FEEDBACK
router.use(require("./routes/api-feedback.cjs"));

// PAYPAL
router.use(require("./routes/paypal-create.cjs"));
router.use(require("./routes/paypal-complete.cjs"));
router.use(require("./routes/paypal-cancel.cjs"));

// ADMIN API (NUOVE)
router.use(require("./routes/api-admin-analytics.cjs"));

// ❌ ADMIN VECCHI — RIMOSSI COMPLETAMENTE
// router.use(require("./routes/admin-analisi.cjs"));
// router.use(require("./routes/admin-feedback.cjs"));
// router.use(require("./routes/admin-ordini.cjs"));
// router.use(require("./routes/admin-settings.cjs"));
// router.use(require("./routes/admin-stats.cjs"));
// router.use(require("./routes/admin-vendite.cjs"));
// router.use(require("./routes/admin-novita.cjs"));

module.exports = router;
