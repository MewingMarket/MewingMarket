/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * Versione 2027.301 — PATCH UTENTI + ALIAS IN FONDO
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
    console.log("🟩 [ROUTER] diagnostica.cjs agganciata");
  } else {
    console.log("🟨 [ROUTER] diagnostica.cjs presente ma senza hookRouter()");
  }
} catch (err) {
  console.log("🟧 [ROUTER] diagnostica.cjs non presente (ok):", err.message);
}

/* =========================================================
   ⭐ PATCH: AUTH USER — SEMPRE ATTIVO
========================================================= */
router.use(R("middleware/auth-user.cjs"));

/* =========================================================
   ⭐ TUTTE LE ROUTE PUBBLICHE (ordine stabile)
========================================================= */

/* PRODOTTI */
router.use(R("routes/api-prodotti-new.cjs"));

/* UTENTI — PATCH FONDAMENTALE */
router.use("/api/utenti", R("routes/api-utenti.cjs"));

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

/* =========================================================
   ⭐ API ALIAS — ***SPOSTATO IN FONDO***
========================================================= */
router.use(R("routes/api-alias.cjs"));

console.log("🟩 [ROUTER] Router principale caricato correttamente (TUTTO PUBBLICO)");

module.exports = router;
