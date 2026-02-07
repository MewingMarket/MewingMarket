/* =========================================================
   IMPORT BASE
========================================================= */
const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const multer = require("multer");
require("dotenv").config();

/* =========================================================
   APP
========================================================= */
const app = express();
app.disable("x-powered-by");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

/* =========================================================
   FRONTEND DEBUG STORAGE
========================================================= */
let FRONTEND_LOG = [];

app.post("/debug/log", (req, res) => {
  const { type, message } = req.body || {};

  FRONTEND_LOG.push({
    time: new Date().toISOString(),
    type: type || "generic",
    message: message || ""
  });

  if (FRONTEND_LOG.length > 2000) FRONTEND_LOG.shift();

  res.json({ ok: true });
});

app.get("/debug/frontend", (req, res) => {
  res.json(FRONTEND_LOG);
});

/* =========================================================
   BACKEND DEBUG STORAGE
========================================================= */
global.BOT_DEBUG_LOG = global.BOT_DEBUG_LOG || [];

function logBotDebug(entry) {
  global.BOT_DEBUG_LOG.push({
    time: new Date().toISOString(),
    ...entry
  });

  if (global.BOT_DEBUG_LOG.length > 2000) global.BOT_DEBUG_LOG.shift();
}

/* =========================================================
   MULTER — UPLOAD FILE CHAT
========================================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "public", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "upload_" + Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.post("/chat/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.json({ error: "Nessun file ricevuto" });

  logBotDebug({
    step: "file_upload",
    data: { filename: req.file.filename, size: req.file.size }
  });

  res.json({ fileUrl: "/uploads/" + req.file.filename });
});

/* =========================================================
   STATO UTENTI GLOBALE (BOT)
========================================================= */
const userStates = {};

/* =========================================================
   MODULI INTERNi
========================================================= */
const { generateNewsletterHTML } = require("./modules/newsletter");
const { syncAirtable, loadProducts, getProducts } = require("./modules/airtable");
const { detectIntent, handleConversation, generateUID } = require("./modules/bot");
const { inviaNewsletter } = require("./modules/brevo");
const { generateImagesSitemap } = require("./modules/sitemap-images");
const { generateStoreSitemap } = require("./modules/sitemap-store");
const { generateSocialSitemap } = require("./modules/sitemap-social");
const { generateFooterSitemap } = require("./modules/sitemap-footer");
const { generateSitemap } = require("./modules/sitemap");
const Context = require("./modules/context");
