/**
 * =========================================================
 * UNIVERSAL API ALIAS — Versione 2027.900 + PATCH COMPLETA
 * Supporta:
 * /api
 * /api/v1
 * /api/v2
 * /api/latest
 * /API /Api /aPi /api
 * =========================================================
 */

const express = require("express");
const path = require("path");
const router = express.Router();

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const versions = [
  "",
  "v1",
  "v2",
  "latest",
  "API",
  "Api",
  "aPi",
  "api"
];

versions.forEach(v => {
  const prefix = v ? `/api/${v}` : `/api`;

  // =========================
  // PRODOTTI
  // =========================
  router.use(`${prefix}/products`, R("routes/api-prodotti-new.cjs"));
  router.use(`${prefix}/prodotti`, R("routes/api-prodotti-new.cjs"));
  // ⚠️ /catalogo rimosso: route fantasma che rispondeva "{}"
  // router.use(`${prefix}/catalogo`, R("routes/api-prodotti-new.cjs"));

  // =========================
  // RECENSIONI
  // =========================
  router.use(`${prefix}/recensioni`, R("routes/api-feedback.cjs"));
  router.use(`${prefix}/recensioni-top`, R("routes/api-recensioni-top.cjs"));

  // =========================
  // PRODUCT PAGE
  // =========================
  router.use(`${prefix}/product-page`, R("routes/product-page.cjs"));

  // =========================
  // VERSIONE + SYSTEM STATUS
  // =========================
  router.use(`${prefix}/versione`, R("routes/versione.cjs"));
  router.use(`${prefix}/system-status`, R("routes/system-status.cjs"));

  // =========================
  // ORDINI / VENDITE / RIMBORSO
  // =========================
  router.use(`${prefix}/ordini`, R("routes/ordini-utente.cjs"));
  router.use(`${prefix}/vendite`, R("routes/api-vendite-download.cjs"));
  router.use(`${prefix}/rimborso`, R("routes/api-rimborso.cjs"));

  // =========================
  // UPLOAD
  // =========================
  router.use(`${prefix}/upload`, R("routes/api-upload.cjs"));

  // =========================
  // UTENTI
  // =========================
  // API utenti (login, register, me, ecc.)
  router.use(`${prefix}/utenti`, R("routes/api-utenti.cjs"));
  // Evento utente (PATCH corretta: prima mappavi /utenti → utenti-evento)
  router.use(`${prefix}/utenti/evento`, R("routes/utenti-evento.cjs"));

  // =========================
  // ASSISTENZA
  // =========================
  router.use(`${prefix}/assistenza`, R("routes/api-assistenza.cjs"));

  // =========================
  // CHAT
  // =========================
  router.use(`${prefix}/chat`, R("routes/chat.cjs"));
  router.use(`${prefix}/chat-voice`, R("routes/chat-voice.cjs"));

  // =========================
  // META FEED
  // =========================
  router.use(`${prefix}/meta-feed`, R("routes/meta-feed.cjs"));

  // =========================
  // NEWSLETTER
  // =========================
  router.use(`${prefix}/newsletter`, R("routes/newsletter.cjs"));

  // =========================
  // HEALTH
  // =========================
  router.use(`${prefix}/health`, R("routes/api-health.cjs"));

  // =========================
  // ADMIN
  // =========================
  router.use(`${prefix}/admin/dashboard`, R("routes/admin-dashboard.cjs"));
  router.use(`${prefix}/admin/utenti`, R("routes/admin-utenti.cjs"));
  router.use(`${prefix}/admin/feedback`, R("routes/admin-feedback.cjs"));
  router.use(`${prefix}/admin/api`, R("routes/api-admin.cjs"));

  // =========================
  // PAYPAL
  // =========================
  router.use(`${prefix}/paypal/create`, R("routes/paypal-create.cjs"));
  router.use(`${prefix}/paypal/complete`, R("routes/paypal-complete.cjs"));
  router.use(`${prefix}/paypal/cancel`, R("routes/paypal-cancel.cjs"));
  router.use(`${prefix}/paypal/ricrea`, R("routes/paypal-ricrea.cjs"));
});

module.exports = router;
