// =========================================================
// File: app/server/router.cjs
// Router principale (PATCHATO)
// =========================================================

const express = require("express");
const router = express.Router();

// --- API ORIGINALI ---
router.use(require("./routes/api-login.cjs"));
router.use(require("./routes/api-reset.cjs"));
router.use(require("./routes/api-prodotti.cjs"));
router.use(require("./routes/api-ordini.cjs"));          // ✔️ REINSERITO
router.use(require("./routes/api-vendite.cjs"));
router.use(require("./routes/api-upload.cjs"));
router.use(require("./routes/api-registrazione.cjs"));   // ✔️ REGISTRAZIONE

// =========================================================
// 🔥 NUOVI MODULI (BRIDGE + ADMIN)
// =========================================================

// Bridge legacy → Airtable (catalogo, ordini utente, download, newsletter, utente)
router.use(require("./routes/api-bridge.cjs"));

// Bridge PayPal legacy → nuovo PayPal Model A
router.use(require("./routes/api-paypal-bridge.cjs"));

// Admin login + sessione
const { router: adminAuthRouter } = require("./routes/api-admin-auth.cjs");
router.use(adminAuthRouter);

// Admin ordini + stats
router.use(require("./routes/api-admin-ordini.cjs"));

// =========================================================
// Dashboard login (pagina statica)
// =========================================================
router.get("/dashboard", (req, res) => {
  res.sendFile("dashboard-login.html", { root: "app/public" });
});

module.exports = router;
