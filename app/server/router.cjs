/* FILE: app/server/router.cjs */
/**
 * =========================================================
 * Router principale — SOLO API
 * Versione 2027.910 — FIXED PATHS + FAILSAFE
 * =========================================================
 */

const express = require("express");
const path = require("path");
const router = express.Router();

/* Helper per require assoluti */
const R = (p) => require(path.join(process.cwd(), "app/server", p));

console.log("🟦 [ROUTER] Caricamento router principale avviato");

/* =========================================================
   🔍 HOOK DIAGNOSTICA
========================================================= */
try {
  const diagnostica = R("diagnostica.cjs");
  if (typeof diagnostica?.hookRouter === "function") {
    diagnostica.hookRouter(router);
  }
} catch (err) {
  console.log("🟧 [ROUTER] diagnostica.cjs non presente:", err.message);
}

/* =========================================================
   ⭐ PATCH: AUTH USER — Middleware identità
========================================================= */
router.use(R("middleware/auth-user.cjs"));

/* =========================================================
   ⭐ ROTTE API (Rimosso prefisso /api/ interno perché già in server.cjs)
========================================================= */

/* PRODOTTI */
router.use(R("routes/api-prodotti-new.cjs"));

/* UTENTI — CORRETTO: server.cjs mette già /api, qui usiamo solo /utenti */
router.use("/utenti", R("routes/api-utenti.cjs"));

/* PUBBLICHE */
router.use(R("routes/api-recensioni-top.cjs"));
router.use(R("routes/product-page.cjs"));
router.use(R("routes/sitemap.cjs"));
router.use(R("routes/versione.cjs"));
router.use(R("routes/system-status.cjs"));
router.use(R("routes/api-health.cjs"));

/* PAYPAL */
router.use(R("routes/paypal-create.cjs"));
router.use(R("routes/paypal-complete.cjs"));
router.use(R("routes/paypal-cancel.cjs"));
router.use(R("routes/paypal-ricrea.cjs"));

/* ADMIN */
router.use(R("routes/admin-dashboard.cjs"));
router.use(R("routes/admin-feedback.cjs"));
router.use(R("routes/admin-utenti.cjs"));
router.use(R("routes/api-admin.cjs"));
router.use(R("routes/api-rimborso.cjs"));

/* UTENTE */
router.use(R("routes/api-upload.cjs"));
router.use(R("routes/ordini-utente.cjs"));
router.use(R("routes/api-feedback.cjs"));
router.use(R("routes/api-vendite-download.cjs"));
router.use(R("routes/prodotti-ai.cjs"));
router.use(R("routes/utenti-evento.cjs"));

/* ASSISTENZA */
router.use(R("routes/api-assistenza.cjs"));

/* CHAT */
router.use(R("routes/chat.cjs"));
router.use(R("routes/chat-voice.cjs"));

/* META FEED */
router.use(R("routes/meta-feed.cjs"));

/* NEWSLETTER */
router.use(R("routes/newsletter.cjs"));

/* ALIAS */
router.use(R("routes/api-alias.cjs"));

console.log("🟩 [ROUTER] Router principale caricato (Paths Fixed)");

/* =========================================================
   ⭐ FAILSAFE FINALE
========================================================= */
router.use((err, req, res, next) => {
  console.error("❌ [ROUTER ERROR]:", req.path, err.message);
  // Restituisce un oggetto vuoto ma con status 200 per non rompere il frontend
  return res.status(200).json({ success: false, error: "Route error" });
});

module.exports = router;
