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
   🔥 ARCHIVIO LOG UNIVERSALE
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
   SETUP EXPRESS
========================================================= */
const app = express();
app.disable("x-powered-by");

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
const { detectIntent, handleConversation, reply, generateUID } = require("./modules/bot");
const { inviaNewsletter } = require("./modules/brevo");
const { generateImagesSitemap } = require("./modules/sitemap-images");
const { generateStoreSitemap } = require("./modules/sitemap-store");
const { generateSocialSitemap } = require("./modules/sitemap-social");
const { generateFooterSitemap } = require("./modules/sitemap-footer");
const { safeText } = require("./modules/utils");
const Context = require("./modules/context");

/* Tracking GA4 server-side */
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
   CACHE HEADERS
========================================================= */
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

/* =========================================================
   MIDDLEWARE BASE
========================================================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

/* =========================================================
   🔥 DEBUG BACKEND — LOGGA TUTTO
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

  const send = res.send;
  res.send = function (body) {
    addDebugLog("response", {
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      body: typeof body === "string" ? body.substring(0, 500) : body
    });

    return send.call(this, body);
  };

  next();
});

/* =========================================================
   REDIRECT HTTPS + WWW — PATCH RENDER SAFE
========================================================= */
app.use((req, res, next) => {
  try {
    const proto = req.headers["x-forwarded-proto"];
    const host = req.headers.host || "";

    if (process.env.RENDER === "true") return next();
    if (!host) return next();

    if (proto && proto !== "https") {
      return res.redirect(301, `https://${host}${req.url}`);
    }

    if (host === "mewingmarket.it") {
      return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
    }

    if (!host.startsWith("www.")) {
      return res.redirect(301, `https://www.${host}${req.url}`);
    }

    next();
  } catch (err) {
    console.error("Redirect error:", err);
    next();
  }
});

/* =========================================================
   USER STATE + COOKIE UID
========================================================= */
app.use((req, res, next) => {
  let uid = null;

  try {
    uid = req.cookies?.mm_uid || null;
  } catch {
    uid = null;
  }

  const invalid = !uid || typeof uid !== "string" || !uid.startsWith("mm_");

  if (invalid) {
    uid = generateUID();
    res.cookie("mm_uid", uid, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 30
    });
  }

  if (!userStates[uid]) {
    userStates[uid] = { state: "menu", lastIntent: null, data: {} };
  }

  req.uid = uid;
  req.userState = userStates[uid];

  next();
});

/* =========================================================
   MIDDLEWARE MAX
========================================================= */
app.use((req, res, next) => {
  try {
    if (!req.body) req.body = {};
    if (!req.query) req.query = {};

    const uid = req.uid;
    const body = req.body;
    const query = req.query;

    const page = body.page ?? query.page ?? null;
    const slug = body.slug ?? query.slug ?? null;

    if (page || slug) {
      Context.update(uid, page, slug);
      trackGA4("page_view", { uid, page: page || "", slug: slug || "" });
    }

    if (typeof body.message === "string") {
      body.message = safeText(body.message);
      req.body = body;
    }

    next();
  } catch (err) {
    console.error("Middleware MAX error:", err);
    next();
  }
});

/* =========================================================
   🔥 INIEZIONE AUTOMATICA DI debug.js (VERSIONE CORRETTA)
========================================================= */
app.use((req, res, next) => {
  const send = res.send;

  res.send = function (body) {
    try {
      if (typeof body === "string" && body.includes("</body>")) {
        addDebugLog("inject", { url: req.url });
        body = body.replace(
          "</body>",
          `<script src="/debug.js"></script></body>`
        );
      }
    } catch (err) {
      addDebugLog("inject-error", err.toString());
    }

    return send.call(this, body);
  };

  next();
});

/* =========================================================
   SITEMAP + PAGINE
========================================================= */
app.get("/sitemap-images.xml", (req, res) => {
  try { res.type("application/xml").send(generateImagesSitemap()); }
  catch { res.status(500).send("Errore sitemap"); }
});

app.get("/sitemap-store.xml", (req, res) => {
  try { res.type("application/xml").send(generateStoreSitemap()); }
  catch { res.status(500).send("Errore sitemap"); }
});

app.get("/sitemap-social.xml", (req, res) => {
  try { res.type("application/xml").send(generateSocialSitemap()); }
  catch { res.status(500).send("Errore sitemap"); }
});

app.get("/sitemap.xml", (req, res) => {
  try { res.type("application/xml").send(generateFooterSitemap()); }
  catch { res.status(500).send("Errore sitemap"); }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/products.json", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "products.json"));
});

app.get("/prodotto.html", (req, res) => {
  try {
    const slug = req.query.slug;
    if (!slug) return res.status(400).send("Parametro slug mancante");

    const products = getProducts() || [];
    const prodotto = products.find(p => p.slug === slug);

    if (!prodotto) return res.status(404).send("Prodotto non trovato");

    res.sendFile(path.join(__dirname, "public", "prodotto.html"));
  } catch {
    res.status(500).send("Errore pagina prodotto");
  }
});

/* =========================================================
   🔥 DASHBOARD DEBUG
========================================================= */
app.get("/debug", (req, res) => {
  res.send(`
    <html>
    <head>
      <title>MewingMarket Debug Dashboard</title>
      <style>
        body { background:#111; color:#0f0; font-family:monospace; padding:20px; }
        pre { white-space:pre-wrap; }
      </style>
    </head>
    <body>
      <h1>🔥 MewingMarket Debug Dashboard</h1>
      <p>Aggiornamento ogni 2 secondi</p>
      <pre id="log">Caricamento...</pre>

      <script>
        async function loadLogs() {
          const res = await fetch("/debug/feed");
          const logs = await res.json();
          document.getElementById("log").textContent =
            logs.map(l => "[" + l.time + "] (" + l.type + ") " + JSON.stringify(l.data)).join("\\n\\n");
        }
        setInterval(loadLogs, 2000);
        loadLogs();
      </script>
    </body>
    </html>
  `);
});

/* =========================================================
   🔥 FEED LOG
========================================================= */
app.get("/debug/feed", (req, res) => {
  res.json(DEBUG_LOG);
});

/* =========================================================
   🔥 RICEZIONE LOG FRONTEND
========================================================= */
app.post("/debug/log", (req, res) => {
  addDebugLog(req.body.type || "frontend", req.body.message || "");
  res.json({ ok: true });
});

/* =========================================================
   ⭐ CHAT BOT
========================================================= */
app.post("/chat", async (req, res) => {
  try {
    const uid = req.uid;
    const rawMessage = req.body?.message;

    if (!rawMessage || rawMessage.trim() === "") {
      return reply(res, "Scrivi un messaggio così posso aiutarti.");
    }

    trackGA4("chat_message_sent", { uid, message: rawMessage });

    const { intent, sub } = detectIntent(rawMessage);
    userStates[uid].lastIntent = intent;

    trackGA4("intent_detected", { uid, intent, sub: sub || "" });

    const response = await handleConversation(req, res, intent, sub, rawMessage);

    trackGA4("chat_message_received", { uid, intent, sub: sub || "" });

    return response;
  } catch (err) {
    console.error("❌ Errore /chat:", err);
    return reply(res, "Sto avendo un problema temporaneo. Riprova tra poco.");
  }
});

/* =========================================================
   NEWSLETTER
========================================================= */
const { iscriviEmail } = require("./modules/brevoSubscribe");
const { disiscriviEmail } = require("./modules/brevoUnsubscribe");

const welcomeHTML = fs.readFileSync(
  path.join(__dirname, "modules", "welcome.html"),
  "utf8"
);

app.post("/newsletter/subscribe", async (req, res) => {
  try {
    const email = req.body?.email?.trim();
    if (!email) return res.json({ status: "error", message: "Email mancante" });

    await iscriviEmail(email);

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "MewingMarket", email: "vendite@mewingmarket.it" },
        to: [{ email }],
        subject: "👋 Benvenuto in MewingMarket",
        htmlContent: welcomeHTML
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Errore iscrizione newsletter:", err);
    return res.json({ status: "error" });
  }
});

app.post("/newsletter/unsubscribe", async (req, res) => {
  try {
    const email = req.body?.email?.trim();
    if (!email) return res.json({ status: "error", message: "Email mancante" });

    await disiscriviEmail(email);
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Errore disiscrizione newsletter:", err);
    return res.json({ status: "error" });
  }
});

app.post("/newsletter/send", async (req, res) => {
  try {
    const { html, oggetto } = generateNewsletterHTML();
    if (!html || !oggetto) return res.json({ status: "error" });

    const result = await inviaNewsletter({ oggetto, html });
    return res.json({ status: "ok", result });
  } catch (err) {
    console.error("❌ Errore invio newsletter:", err);
    return res.json({ status: "error" });
  }
});

/* =========================================================
   STATICI — DOPO TUTTE LE API
========================================================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================================================
   AVVIO SERVER
========================================================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`MewingMarket attivo sulla porta ${PORT}`);

  (async () => {
    try {
      console.log("⏳ Sync automatico Airtable all'avvio...");
      await syncAirtable().catch(err => console.error("❌ Errore sync:", err));
      loadProducts();
      console.log("✅ Sync completato");
    } catch (err) {
      console.error("❌ Errore nel sync all'avvio:", err);
    }
  })();
});

/* =========================================================
   SYNC PROGRAMMATA
========================================================= */
setInterval(async () => {
  try {
    console.log("⏳ Sync programmato Airtable...");
    await syncAirtable().catch(err => console.error("❌ Errore sync:", err));
    loadProducts();
    console.log("✅ Sync programmato completato");
  } catch (err) {
    console.error("❌ Errore nel sync programmato:", err);
  }
}, 30 * 60 * 1000);

/* =========================================================
   NEWSLETTER AUTOMATICA — NUOVO PRODOTTO
========================================================= */
let lastProductId = null;

async function checkNewProduct() {
  try {
    const products = getProducts() || [];
    if (!products.length) return;

    const latest = products[products.length - 1];
    if (!latest) return;

    const latestId = latest.id;
    if (!latestId) return;

    if (!lastProductId) {
      lastProductId = latestId;
      return;
    }

    if (latestId !== lastProductId) {
      const { html, oggetto } = generateNewsletterHTML() || {};
      if (html && oggetto) {
        await inviaNewsletter({ oggetto, html });
      }
      lastProductId = latestId;
    }
  } catch (err) {
    console.error("❌ Errore controllo nuovo prodotto:", err);
  }
}

setInterval(checkNewProduct, 5 * 60 * 1000);
