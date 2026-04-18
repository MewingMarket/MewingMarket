/**
 * =========================================================
 * UNIVERSAL API ALIAS — Versione 2027.900
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

  // PRODOTTI
  router.use(`${prefix}/products`, R("routes/api-prodotti-new.cjs"));
  router.use(`${prefix}/prodotti`, R("routes/api-prodotti-new.cjs"));
  router.use(`${prefix}/catalogo`, R("routes/api-prodotti-new.cjs"));

  // RECENSIONI
  router.use(`${prefix}/recensioni`, R("routes/api-feedback.cjs"));
  router.use(`${prefix}/recensioni-top`, R("routes/api-recensioni-top.cjs"));

  // PRODUCT PAGE
  router.use(`${prefix}/product-page`, R("routes/product-page.cjs"));

  // VERSIONE + SYSTEM STATUS
  router.use(`${prefix}/versione`, R("routes/versione.cjs"));
  router.use(`${prefix}/system-status`, R("routes/system-status.cjs"));

  // ORDINI / ADMIN / VENDITE / RIMBORSO
  router.use(`${prefix}/ordini`, R("routes/ordini-utente.cjs"));
  router.use(`${prefix}/admin`, R("routes/admin-feedback.cjs"));
  router.use(`${prefix}/vendite`, R("routes/api-vendite-download.cjs"));
  router.use(`${prefix}/rimborso`, R("routes/api-rimborso.cjs"));

  // UPLOAD
  router.use(`${prefix}/upload`, R("routes/api-upload.cjs"));
});

module.exports = router;
