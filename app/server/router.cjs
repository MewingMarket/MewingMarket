// =========================================================
// File: app/server/router.cjs
// Router principale (PATCHATO DEFINITIVO)
// =========================================================

const express = require("express");
const router = express.Router();

// =========================================================
// API ORIGINALI
// =========================================================
router.use(require("./routes/api-login.cjs"));
router.use(require("./routes/api-reset.cjs"));
router.use(require("./routes/api-prodotti.cjs"));
router.use(require("./routes/api-ordini.cjs"));
router.use(require("./routes/api-vendite.cjs"));
router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/api-registrazione.cjs"));

// =========================================================
// BRIDGE LEGACY
// =========================================================
router.use(require("./routes/api-bridge.cjs"));

// =========================================================
// PAYPAL BRIDGE
// =========================================================
router.use(require("./routes/api-paypal-bridge.cjs"));

// =========================================================
// ADMIN (NUOVI MODULI API)
// =========================================================
const { router: adminAuthRouter } = require("./routes/api-admin-auth.cjs");
router.use(adminAuthRouter);

router.use(require("./routes/api-admin-analytics.cjs"));
router.use(require("./routes/api-admin-vendite.cjs"));
router.use(require("./routes/api-admin-utenti.cjs"));
router.use(require("./routes/api-admin-ordini.cjs"));   // ← ESISTE DAVVERO

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
