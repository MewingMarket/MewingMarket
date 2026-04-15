/**
 * =========================================================
 * File: app/server/router.cjs
 * Router principale — SOLO API
 * Versione DEFINITIVA 2026.500 — require assoluti + FULL ROUTES
 * Patch 2026.900 — DEBUG + HOOK diagnostica.cjs
 * Patch 2026.960 — MOUNT /api/products (api-prodotti-new.cjs)
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
   1) ROTTE PUBBLICHE (NO TOKEN)
========================================================= */
router.use("/utenti", R("routes/api-utenti.cjs"));
router.use(R("routes/api-recensioni-top.cjs"));
router.use(R("routes/product-page.cjs"));
router.use(R("routes/sitemap.cjs"));
router.use(R("routes/versione.cjs"));
router.use(R("routes/system-status.cjs"));

/* =========================================================
   ⭐ PATCH: API PRODOTTI — PUBBLICA
   Deve stare PRIMA di auth-user
   E SENZA /api perché il server monta già /api
========================================================= */
router.use("/", R("routes/api-prodotti-new.cjs"));

/* =========================================================
   2) ADMIN (protette da auth-admin)
========================================================= */
const authAdmin = R("middleware/auth-admin.cjs");
router.use("/admin", authAdmin);

/* =========================================================
   ADMIN ROUTES
========================================================= */
router.use("/admin", R("routes/admin-dashboard.cjs"));
router.use("/admin", R("routes/admin-feedback.cjs"));
router.use("/admin", R("routes/admin-utenti.cjs"));
router.use("/admin", R("routes/api-admin.cjs"));

/* =========================================================
   ⭐ PATCH: ADMIN RIMBORSI (UNIFICATO)
========================================================= */
router.use("/admin", R("routes/api-rimborso.cjs"));

/* =========================================================
   3) MIDDLEWARE USER (TOKEN OBBLIGATORIO)
========================================================= */
router.use(R("middleware/auth-user.cjs"));

/* =========================================================
   4) ROTTE UTENTE PROTETTE
========================================================= */
router.use(R("routes/api-upload.cjs"));
router.use(R("routes/ordini-utente.cjs"));
router.use(R("routes/api-feedback.cjs"));
router.use(R("routes/api-vendite-download.cjs"));
router.use("/prodotti", R("routes/prodotti-ai.cjs"));

/* =========================================================
   ⭐ PATCH: ASSISTENZA
========================================================= */
router.use(R("routes/api-assistenza.cjs"));

/* =========================================================
   ⭐ PATCH: CHAT + VOICE
========================================================= */
router.use(R("routes/chat.cjs"));
router.use(R("routes/chat-voice.cjs"));

/* =========================================================
   ⭐ PATCH: META FEED
========================================================= */
router.use(R("routes/meta-feed.cjs"));

/* =========================================================
   ⭐ PATCH: NEWSLETTER
========================================================= */
router.use(R("routes/newsletter.cjs"));

/* =========================================================
   5) PAYPAL (PUBLIC)
========================================================= */
router.use(R("routes/paypal-create.cjs"));
router.use(R("routes/paypal-complete.cjs"));
router.use(R("routes/paypal-cancel.cjs"));
router.use(R("routes/paypal-ricrea.cjs"));

console.log("🟩 [ROUTER] Router principale caricato correttamente");

module.exports = router;
