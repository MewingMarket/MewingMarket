/* =========================================================
   IMPORT BASE
========================================================= */
const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const axios = require("axios");
require("dotenv").config();
const multer = require("multer");

/* =========================================================
   SETUP EXPRESS
========================================================= */
const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

/* =========================================================
   🔥 FRONTEND DEBUG STORAGE
========================================================= */
let FRONTEND_LOG = [];

app.post("/debug/log", (req, res) => {
  const { type, message } = req.body;

  FRONTEND_LOG.push({
    time: new Date().toISOString(),
    type,
    message
  });

  if (FRONTEND_LOG.length > 2000) FRONTEND_LOG.shift();

  res.json({ ok: true });
});

app.get("/debug/frontend", (req, res) => {
  res.json(FRONTEND_LOG);
});

/* =========================================================
   🔥 BACKEND DEBUG STORAGE (BOT_DEBUG_LOG globale)
========================================================= */
global.BOT_DEBUG_LOG = global.BOT_DEBUG_LOG || [];

app.get("/debug/backend", (req, res) => {
  res.json(global.BOT_DEBUG_LOG);
});

/* =========================================================
   🔥 ARCHIVIO LOG UNIVERSALE (opzionale)
========================================================= */
const DEBUG_LOG = [];
function addDebugLog(type, data) {
  DEBUG_LOG.push({
    time: new Date().toISOString(),
    type,
    data
  });

  if (DEBUG_LOG.length > 5000) DEBUG_LOG.shift();
}

/* =========================================================
   🔥 BOT DEBUG WRAPPER
========================================================= */
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
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "upload_" + Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* =========================================================
   ENDPOINT UPLOAD FILE CHAT
========================================================= */
app.post("/chat/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.json({ error: "Nessun file ricevuto" });

  logBotDebug({
    step: "file_upload",
    data: { filename: req.file.filename, size: req.file.size }
  });

  res.json({ fileUrl: "/uploads/" + req.file.filename });
});

/* =========================================================
   STATO UTENTI GLOBALE
========================================================= */
const userStates = {};

/* =========================================================
   IMPORT MODULI INTERNI
========================================================= */
const { generateNewsletterHTML } = require("./modules/newsletter");
const { syncAirtable, loadProducts, getProducts } = require("./modules/airtable");
const { detectIntent, handleConversation, generateUID } = require("./modules/bot");
const { inviaNewsletter } = require("./modules/brevo");
const { generateImagesSitemap } = require("./modules/sitemap-images");
const { generateStoreSitemap } = require("./modules/sitemap-store");
const { generateSocialSitemap } = require("./modules/sitemap-social");
const { generateFooterSitemap } = require("./modules/sitemap-footer");
const { safeText } = require("./modules/utils");
const Context = require("./modules/context");

/* =========================================================
   GA4 TRACKING
========================================================= */
const GA4_ID = process.env.GA4_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

async function trackGA4(eventName, params = {}) {
  try {
    if (!GA4_ID || !GA4_API_SECRET) return;

    await axios.post(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_API_SECRET}`,
      {
        client_id: params.uid || "unknown",
        events: [{ name: eventName, params }]
      }
    );
  } catch (err) {
    console.error("GA4 tracking error:", err?.response?.data || err);
  }
}

/* =========================================================
   CACHE HEADERS + DEBUG REQUEST
========================================================= */
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  logBotDebug({
    step: "request",
    data: {
      method: req.method,
      url: req.url,
      ip: req.ip
    }
  });

  next();
});

/* =========================================================
   DEBUG MIDDLEWARE — LOGGA TUTTO
========================================================= */
app.use((req, res, next) => {
  const start = Date.now();

  addDebugLog("request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    body: req.body,
    query: req.query,
    headers: req.headers
  });

  logBotDebug({
    step: "middleware_request",
    data: {
      method: req.method,
      url: req.url,
      ip: req.ip
    }
  });

  const send = res.send;
  res.send = function (body) {
    addDebugLog("response", {
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      body: typeof body === "string" ? body.substring(0, 500) : body
    });

    logBotDebug({
      step: "middleware_response",
      data: {
        url: req.url,
        status: res.statusCode,
        duration: Date.now() - start
      }
    });

    return send.call(this, body);
  };

  next();
});

/* =========================================================
   STATIC FILES
========================================================= */
app.use(express.static("public"));

/* =========================================================
   SITEMAP ENDPOINTS
========================================================= */
app.get("/sitemap-images.xml", async (req, res) => {
  try {
    const xml = await generateImagesSitemap();
    res.header("Content-Type", "application/xml");
    res.send(xml);

    logBotDebug({ step: "sitemap_images", data: { status: "ok" } });

  } catch (err) {
    logBotDebug({ step: "sitemap_images_error", data: { error: err.message } });
    res.status(500).send("Errore generazione sitemap immagini");
  }
});

app.get("/sitemap-store.xml", async (req, res) => {
  try {
    const xml = await generateStoreSitemap();
    res.header("Content-Type", "application/xml");
    res.send(xml);

    logBotDebug({ step: "sitemap_store", data: { status: "ok" } });

  } catch (err) {
    logBotDebug({ step: "sitemap_store_error", data: { error: err.message } });
    res.status(500).send("Errore generazione sitemap store");
  }
});

app.get("/sitemap-social.xml", async (req, res) => {
  try {
    const xml = await generateSocialSitemap();
    res.header("Content-Type", "application/xml");
    res.send(xml);

    logBotDebug({ step: "sitemap_social", data: { status: "ok" } });

  } catch (err) {
    logBotDebug({ step: "sitemap_social_error", data: { error: err.message } });
    res.status(500).send("Errore generazione sitemap social");
  }
});

app.get("/sitemap-footer.xml", async (req, res) => {
  try {
    const xml = await generateFooterSitemap();
    res.header("Content-Type", "application/xml");
    res.send(xml);

    logBotDebug({ step: "sitemap_footer", data: { status: "ok" } });

  } catch (err) {
    logBotDebug({ step: "sitemap_footer_error", data: { error: err.message } });
    res.status(500).send("Errore generazione sitemap footer");
  }
});

/* =========================================================
   NEWSLETTER — GENERAZIONE HTML
========================================================= */
app.post("/newsletter/genera", async (req, res) => {
  try {
    const { titolo, contenuto } = req.body;

    logBotDebug({ step: "newsletter_generate", data: { titolo } });

    const html = generateNewsletterHTML(titolo, contenuto);
    res.json({ html });

  } catch (err) {
    logBotDebug({ step: "newsletter_generate_error", data: { error: err.message } });
    res.status(500).json({ error: "Errore generazione newsletter" });
  }
});

/* =========================================================
   NEWSLETTER — INVIO
========================================================= */
app.post("/newsletter/invia", async (req, res) => {
  try {
    const { oggetto, html } = req.body;

    logBotDebug({ step: "newsletter_send", data: { oggetto } });

    const result = await inviaNewsletter(oggetto, html);
    res.json({ ok: true, result });

  } catch (err) {
    logBotDebug({ step: "newsletter_send_error", data: { error: err.message } });
    res.status(500).json({ error: "Errore invio newsletter" });
  }
});

/* =========================================================
   AIRTABLE SYNC
========================================================= */
app.get("/admin/sync-airtable", async (req, res) => {
  try {
    logBotDebug({ step: "airtable_sync_start", data: {} });

    await syncAirtable();
    res.send("Sync completato");

    logBotDebug({ step: "airtable_sync_ok", data: {} });

  } catch (err) {
    logBotDebug({ step: "airtable_sync_error", data: { error: err.message } });
    res.status(500).send("Errore sync Airtable");
  }
});

/* =========================================================
   PAGINE STATICHE
========================================================= */
app.get("/", (req, res) => {
  logBotDebug({ step: "page_home", data: {} });
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/store", (req, res) => {
  logBotDebug({ step: "page_store", data: {} });
  res.sendFile(path.join(__dirname, "public", "store.html"));
});

app.get("/contatti", (req, res) => {
  logBotDebug({ step: "page_contatti", data: {} });
  res.sendFile(path.join(__dirname, "public", "contatti.html"));
});

app.get("/privacy", (req, res) => {
  logBotDebug({ step: "page_privacy", data: {} });
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

app.get("/termini", (req, res) => {
  logBotDebug({ step: "page_termini", data: {} });
  res.sendFile(path.join(__dirname, "public", "termini.html"));
});

app.get("/prodotto/:slug", (req, res) => {
  const slug = req.params.slug;

  logBotDebug({ step: "page_prodotto", data: { slug } });

  res.sendFile(path.join(__dirname, "public", "prodotto.html"));
});

/* =========================================================
   PAGINA GENERICA
========================================================= */
app.get("/:page", (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "public", `${page}.html`);

  if (fs.existsSync(filePath)) {
    logBotDebug({ step: "page_generic", data: { page } });
    return res.sendFile(filePath);
  }

  next();
});

/* =========================================================
   ENDPOINT CHATBOT
========================================================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, page, slug } = req.body;

    logBotDebug({
      step: "chat_input",
      data: { message, page, slug }
    });

    // UID da cookie o generato
    let uid = req.cookies.uid;
    if (!uid) {
      uid = generateUID();
      res.cookie("uid", uid, { httpOnly: true, sameSite: "Lax", maxAge: 1000 * 60 * 60 * 24 * 365 });
    }

    // Context pagina
    const pageContext = Context.extract(page, slug);

    // Detect intent
    const { intent, sub } = detectIntent(message);

    logBotDebug({
      step: "chat_intent",
      data: { intent, sub }
    });

    // Risposta bot
    await handleConversation(
      { body: { message }, cookies: req.cookies, userState: userStates[uid] || {}, uid, pageContext, query: req.query },
      res,
      intent,
      sub,
      message
    );

    logBotDebug({
      step: "chat_output",
      data: { status: "sent" }
    });

    return;

  } catch (err) {
    logBotDebug({
      step: "chat_error",
      data: { error: err.message }
    });

    res.status(500).json({ reply: "Errore interno. Riprova tra poco." });
  }
});

/* =========================================================
   ENDPOINT DEBUG BOT — JSON
========================================================= */
app.get("/tracking/bot-debug", (req, res) => {
  res.json(global.BOT_DEBUG_LOG);
});

/* =========================================================
   DASHBOARD DEBUG BOT — HTML
========================================================= */
app.get("/tracking/bot-debug-view", (req, res) => {
  res.send(`
    <html>
    <head>
      <title>BOT DEBUG</title>
      <style>
        body { background:#111; color:#0f0; font-family: monospace; padding:20px; }
        h1 { color:#0f0; }
        pre { white-space: pre-wrap; font-size:14px; }
      </style>
    </head>
    <body>
      <h1>🤖 BOT DEBUG LOG</h1>
      <pre id="log">Caricamento...</pre>

      <script>
        async function load() {
          const r = await fetch("/tracking/bot-debug");
          const j = await r.json();

          document.getElementById("log").textContent =
            j.map(x =>
              "[" + x.time + "] " + x.step + " → " + JSON.stringify(x.data)
            ).join("\\n\\n");
        }

        setInterval(load, 1500);
        load();
      </script>
    </body>
    </html>
  `);
});

/* =========================================================
   AVVIO SERVER
========================================================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server avviato su porta", PORT);

  logBotDebug({
    step: "server_start",
    data: { port: PORT }
  });
});
