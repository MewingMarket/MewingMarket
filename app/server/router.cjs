// =========================================================
// File: app/server/router.cjs
// Router principale — SOLO API
// =========================================================

const express = require("express");
const router = express.Router();

// API UTENTE
router.use(require("./routes/api-prodotti.cjs"));
router.use(require("./routes/api-ordini.cjs"));
router.use(require("./routes/api-vendite.cjs"));
router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/api-utenti.cjs"));
router.use(require("./routes/api-ordini-annulla.cjs"));
router.use(require("./routes/api-ordini-utente.cjs"));
router.use(require("./routes/api-track.cjs"));

// API FEEDBACK
router.use(require("./routes/api-feedback.cjs"));



// PAYPAL

router.use(require("./routes/api-paypal-create.cjs"));
router.use(require("./routes/api-paypal-complete.cjs"));
router.use(require("./routes/api-paypal-cancel.cjs"));

// ADMIN API
router.use(require("./routes/api-admin-analytics.cjs"));

// ADMIN VECCHI
router.use(require("./routes/admin-analisi.cjs"));
router.use(require("./routes/admin-feedback.cjs"));
router.use(require("./routes/admin-ordini.cjs"));
router.use(require("./routes/admin-settings.cjs"));
router.use(require("./routes/admin-stats.cjs"));
router.use(require("./routes/admin-vendite.cjs"));

module.exports = router;
