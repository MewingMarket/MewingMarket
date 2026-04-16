/**
 * =========================================================
 * UNIVERSAL API ALIAS — Versione 2027
 * Accetta TUTTE le varianti:
 * /api
 * /api/v1
 * /api/v2
 * /api/latest
 * /API
 * /Api
 * /aPi
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

  router.use(`${prefix}/ordini`, R("routes/ordini-utente.cjs"));
  router.use(`${prefix}/recensioni`, R("routes/api-feedback.cjs"));
  router.use(`${prefix}/admin`, R("routes/admin-feedback.cjs"));
  router.use(`${prefix}/vendite`, R("routes/api-vendite-download.cjs"));
  router.use(`${prefix}/products`, R("routes/api-prodotti-new.cjs"));
  router.use(`${prefix}/upload`, R("routes/api-upload.cjs"));
  router.use(`${prefix}/rimborso`, R("routes/api-rimborso.cjs"));
});

module.exports = router;
