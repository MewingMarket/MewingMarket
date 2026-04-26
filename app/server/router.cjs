/* =========================================================
   Router principale — SOLO API (Versione Patchata)
========================================================= */

const express = require("express");
const path = require("path");
const router = express.Router();

const R = (p) => require(path.join(process.cwd(), "app/server", p));

// 1. Diagnostica (Sempre in alto)
try {
  const diagnostica = R("diagnostica.cjs");
  if (typeof diagnostica?.hookRouter === "function") diagnostica.hookRouter(router);
} catch (err) {}

// 2. Middleware Identità (Necessario per tutte le chiamate private)
router.use(R("middleware/auth-user.cjs"));

// 3. Rotte Prodotti (Allineate a /api/products e /api/prodotti)
router.use(R("routes/api-prodotti-new.cjs"));

// 4. Utenti & Auth
router.use("/utenti", R("routes/api-utenti.cjs"));

// 5. Assistenza (FIX per "Invio in corso")
// Assicurati che api-assistenza.cjs gestisca la rotta post("/assistenza/invia")
router.use(R("routes/api-assistenza.cjs"));

// 6. Altre Rotte Admin & Utente
router.use(R("routes/admin-dashboard.cjs"));
router.use(R("routes/admin-feedback.cjs"));
router.use(R("routes/admin-utenti.cjs"));
router.use(R("routes/ordini-utente.cjs"));
router.use(R("routes/api-vendite-download.cjs"));

// 7. Utility & Health
router.use(R("routes/api-health.cjs"));
router.use(R("routes/system-status.cjs"));

// 8. Failsafe (Senza status 200 per gli errori reali)
router.use((err, req, res, next) => {
  console.error("❌ [ROUTER ERROR]:", req.path, err.message);
  res.status(500).json({ success: false, error: "Errore interno del server" });
});

module.exports = router;
