// =========================================================
// File: app/server/router.cjs
// Router principale (DEFINITIVO basato sulla struttura reale)
// =========================================================

const express = require("express");
const router = express.Router();

// =========================================================
// API UTENTE REALI
// =========================================================
router.use(require("./routes/api-prodotti.cjs"));
router.use(require("./routes/api-ordini.cjs"));
router.use(require("./routes/api-vendite.cjs"));
router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/api-utenti.cjs"));
router.use(require("./routes/api-utenti-elimina-account.cjs"));
router.use(require("./routes/api-ordini-annulla.cjs"));
router.use(require("./routes/api-ordini-utente.cjs"));
router.use(require("./routes/api-track.cjs"));

// =========================================================
// BRIDGE LEGACY
// =========================================================
router.use(require("./routes/api-bridge.cjs"));

// =========================================================
// PAYPAL
// =========================================================
router.use(require("./routes/api-paypal-bridge.cjs"));
router.use(require("./routes/api-paypal-create.cjs"));
router.use(require("./routes/api-paypal-complete.cjs"));
router.use(require("./routes/api-paypal-cancel.cjs"));

// =========================================================
// ADMIN (NUOVI MODULI API)
// =========================================================
router.use(require("./routes/api-admin-analytics.cjs"));

// =========================================================
// ADMIN (VECCHI MODULI)
// =========================================================
router.use(require("./routes/admin-analisi.cjs"));
router.use(require("./routes/admin-feedback.cjs"));

router.use(require("./routes/admin-ordini.cjs"));
router.use(require("./routes/admin-settings.cjs"));
router.use(require("./routes/admin-stats.cjs"));
router.use(require("./routes/admin-vendite.cjs"));

// =========================================================
// ROUTE FRONTEND
// =========================================================
require("./routes/chat.cjs")(router);
require("./routes/chat-voice.cjs")(router);
require("./routes/newsletter.cjs")(router);
require("./routes/sitemap.cjs")(router);
require("./routes/sales.cjs")(router);
require("./routes/meta-feed.cjs")(router);
require("./routes/product-page.cjs")(router);
require("./routes/system-status.cjs")(router);

module.exports = router;
