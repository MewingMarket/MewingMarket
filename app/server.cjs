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
const Context = require("./modules/context");   /* =========================================================
   DEBUG MIDDLEWARE — REQUEST/RESPONSE
========================================================= */
function addDebugLog(type, data) {
  if (!global.DEBUG_LOG) global.DEBUG_LOG = [];
  global.DEBUG_LOG.push({
    time: new Date().toISOString(),
    type,
    data
  });
  if (global.DEBUG_LOG.length > 5000) global.DEBUG_LOG.shift();
}

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
app.use(express.static(path.join(__dirname, "public")));

/* =========================================================
   UID + USER STATE MIDDLEWARE (BOT + TRACKING)
========================================================= */
app.use((req, res, next) => {
  let uid = req.cookies.uid;
  let mmUid = req.cookies.mm_uid;

  if (!uid && !mmUid) {
    const newUID = generateUID();
    uid = newUID;
    mmUid = newUID;

    res.cookie("uid", newUID, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 1000 * 60 * 60 * 24 * 365
    });

    res.cookie("mm_uid", newUID, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
  } else if (uid && !mmUid) {
    mmUid = uid;
    res.cookie("mm_uid", uid, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
  } else if (!uid && mmUid) {
    uid = mmUid;
    res.cookie("uid", mmUid, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
  }

  req.uid = uid || mmUid;

  if (!userStates[req.uid]) {
    userStates[req.uid] = { state: "menu", lastIntent: null, data: {} };
  }

  req.userState = userStates[req.uid];

  next();
});

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
   PRODUCTS.JSON
========================================================= */
app.get("/products.json", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "products.json"));
});

/* =========================================================
   SITEMAP ENDPOINTS
========================================================= */
app.get("/sitemap.xml", (req, res) => {
  try {
    const xml = generateSitemap();
    res.type("application/xml").send(xml);
    logBotDebug({ step: "sitemap_main", data: { status: "ok" } });
  } catch (err) {
    logBotDebug({ step: "sitemap_main_error", data: { error: err.message } });
    res.status(500).send("Errore generazione sitemap");
  }
});

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
   FEED
========================================================= */
app.get("/meta/feed", (req, res) => {
  const products = getProducts();
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MewingMarket Catalog</title>
    <link>https://www.mewingmarket.it</link>
    <description>Catalogo prodotti MewingMarket</description>
`;

  products.forEach((p, i) => {
    xml += `
    <item>
      <g:id>${p.id || i + 1}</g:id>
      <g:title><![CDATA[${p.titoloBreve || p.titolo}]]></g:title>
      <g:description><![CDATA[${p.descrizioneBreve || p.descrizione || ""}]]></g:description>
      <g:link>${p.linkPayhip}</g:link>
      <g:image_link>${p.immagine}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${p.prezzo || "0.00"} EUR</g:price>
      <g:brand>MewingMarket</g:brand>
      <g:condition>new</g:condition>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  res.type("application/xml").send(xml);
});

app.get("/google/feed", (req, res) => {
  const products = getProducts();
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MewingMarket Google Feed</title>
    <link>https://www.mewingmarket.it</link>
    <description>Feed prodotti per Google Merchant</description>
`;

  products.forEach((p, i) => {
    xml += `
    <item>
      <g:id>${p.id || i + 1}</g:id>
      <g:title><![CDATA[${p.titoloBreve || p.titolo}]]></g:title>
      <g:description><![CDATA[${p.descrizioneBreve || p.descrizione || ""}]]></g:description>
      <g:link>${p.linkPayhip}</g:link>
      <g:image_link>${p.immagine}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${p.prezzo || "0.00"} EUR</g:price>
      <g:brand>MewingMarket</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>2271</g:google_product_category>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  res.type("application/xml").send(xml);
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
    loadProducts();

    logBotDebug({ step: "airtable_sync_ok", data: {} });

    res.send("Sync completato");
  } catch (err) {
    logBotDebug({ step: "airtable_sync_error", data: { error: err.message } });
    res.status(500).send("Errore sync Airtable");
  }
});

/* =========================================================
   TRACKING — STORAGE IN MEMORIA
========================================================= */
const TRACKING_EVENTS = [];
const UTM_LOG = [];

function addEvent(event) {
  TRACKING_EVENTS.push(event);
  if (TRACKING_EVENTS.length > 5000) TRACKING_EVENTS.shift();
}

/* =========================================================
   ENDPOINT TRACKING FRONTEND
========================================================= */
app.post("/tracking/utm", (req, res) => {
  const { utm, url } = req.body || {};

  UTM_LOG.push({
    time: new Date().toISOString(),
    uid: req.uid,
    utm: utm || {},
    url: url || null
  });

  if (UTM_LOG.length > 5000) UTM_LOG.shift();

  logBotDebug({ step: "tracking_utm", data: { uid: req.uid, utm } });

  res.json({ ok: true });
});

app.post("/tracking/event", async (req, res) => {
  const payload = req.body || {};
  payload.serverTime = new Date().toISOString();
  payload.uid = payload.uid || req.uid;

  addEvent(payload);

  logBotDebug({
    step: "tracking_event",
    data: { event: payload.event, type: payload.type, channel: payload.channel }
  });

  trackGA4(payload.event || "event", {
    uid: payload.uid,
    channel: payload.channel,
    type: payload.type,
    page: payload.page
  }).catch(() => {});

  res.json({ ok: true });
});    /* =========================================================
   ENDPOINT TRACKING DASHBOARD
========================================================= */
app.get("/tracking/events", (req, res) => {
  res.json(TRACKING_EVENTS);
});

app.get("/tracking/overview", (req, res) => {
  const total = TRACKING_EVENTS.length;
  const byType = {};
  const byEvent = {};

  TRACKING_EVENTS.forEach(e => {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
  });

  res.json({ total, byType, byEvent });
});

app.get("/tracking/products", (req, res) => {
  const purchases = TRACKING_EVENTS.filter(e => e.event === "purchase");
  const byProduct = {};

  purchases.forEach(e => {
    const id = e.data?.product_id || "unknown";
    if (!byProduct[id]) {
      byProduct[id] = {
        product_id: id,
        product_name: e.data?.product_name || "",
        revenue: 0,
        count: 0
      };
    }
    const price = parseFloat(e.data?.price || 0);
    byProduct[id].revenue += isNaN(price) ? 0 : price;
    byProduct[id].count += 1;
  });

  res.json(Object.values(byProduct));
});

app.get("/tracking/social", (req, res) => {
  const socialEvents = TRACKING_EVENTS.filter(e => e.channel === "social");
  const byEvent = {};

  socialEvents.forEach(e => {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
  });

  res.json({ total: socialEvents.length, byEvent });
});

app.get("/tracking/bot", (req, res) => {
  const botEvents = TRACKING_EVENTS.filter(e => e.type === "bot");
  const byEvent = {};

  botEvents.forEach(e => {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
  });

  res.json({ total: botEvents.length, byEvent });
});

app.get("/tracking/sales", (req, res) => {
  const purchases = TRACKING_EVENTS.filter(e => e.event === "purchase");
  let totalRevenue = 0;

  purchases.forEach(e => {
    const price = parseFloat(e.data?.price || 0);
    if (!isNaN(price)) totalRevenue += price;
  });

  res.json({ count: purchases.length, revenue: totalRevenue });
});

/* =========================================================
   ENDPOINT DEBUG BOT — JSON + VIEW
========================================================= */
app.get("/tracking/bot-debug", (req, res) => {
  res.json(global.BOT_DEBUG_LOG);
});

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
   TRACKING MESSAGGI BOT — USER + BOT + ERRORI
========================================================= */
const BOT_MESSAGES = [];

function logBotMessage(entry) {
  BOT_MESSAGES.push({
    time: new Date().toISOString(),
    ...entry
  });

  if (BOT_MESSAGES.length > 2000) BOT_MESSAGES.shift();
}

function detectProblemType(err) {
  const msg = (err.message || "").toLowerCase();

  if (msg.includes("syntax") || msg.includes("unexpected"))
    return "Errore di sintassi JS";

  if (msg.includes("undefined") || msg.includes("null"))
    return "Errore logico / variabile mancante";

  if (msg.includes("network") || msg.includes("fetch"))
    return "Problema di rete / browser";

  if (msg.includes("timeout"))
    return "Timeout / lentezza server";

  return "Altro / generico";
}

app.get("/tracking/bot-messages", (req, res) => {
  res.json(BOT_MESSAGES);
}); /* =========================================================
   PAGINA HTML PER BOT MESSAGES VIEW — VERSIONE CORRETTA
========================================================= */
app.get("/tracking/bot-messages-view", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>BOT MESSAGES DEBUG</title>
      <style>
        body { background:#111; color:#0f0; font-family: monospace; padding:20px; }
        h1 { color:#0f0; }
        .entry { margin-bottom:20px; padding-bottom:10px; border-bottom:1px solid #333; }
        .error { color:#f33; }
        .bot { color:#0af; }
        .user { color:#0f0; }
      </style>
    </head>
    <body>
      <h1>🤖 BOT MESSAGES DEBUG</h1>
      <div id="log">Caricamento...</div>

      <script>
        async function load() {
          const r = await fetch("/tracking/bot-messages");
          const j = await r.json();

          document.getElementById("log").innerHTML = j.map(x => {
            return \`
              <div class="entry">
                <div>[${x.time}] UID: ${x.uid || ""}</div>

                ${x.user_message ? `<div class="user">👤 Utente: ${x.user_message}</div>` : ""}
                ${x.intent ? `<div>🎯 Intent: ${x.intent}</div>` : ""}
                ${x.sub ? `<div>🔎 Sub-intent: ${x.sub}</div>` : ""}
                ${x.pageContext ? `<div>📄 PageContext: ${JSON.stringify(x.pageContext)}</div>` : ""}

                ${x.bot_reply ? `<div class="bot">🤖 Bot: ${x.bot_reply}</div>` : ""}

                ${x.error ? `<div class="error">❌ Errore: ${x.error}</div>` : ""}
                ${x.problem ? `<div class="error">⚠️ Tipo problema: ${x.problem}</div>` : ""}
              </div>
            \`;
          }).join("");
        }

        setInterval(load, 1500);
        load();
      </script>
    </body>
    </html>
  `);
});
   /* =========================================================
   ENDPOINT CHAT — INTENT, RISPOSTA, LOGGING
========================================================= */
app.post("/chat", async (req, res) => {
  const body = (req.body && typeof req.body === "object") ? req.body : {};
const message = body.message || "";
const pageContext = body.pageContext || null;

  try {
    logBotDebug({
      step: "chat_start",
      data: { uid, message, pageContext }
    });

    // 1) Log del messaggio utente
    logBotMessage({
      uid,
      type: "user",
      user_message: message,
      pageContext
    });

    // 2) Detect intent
    const { intent, sub } = detectIntent(message);

    logBotDebug({
      step: "intent_detected",
      data: { uid, intent, sub }
    });

    // 3) Intercetta res.json per catturare la risposta del bot
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (data && data.reply) {
        res.__lastReply = data.reply;
      }
      return originalJson(data);
    };

    // 4) Esegui la conversazione
    const reply = await handleConversation({
      uid,
      message,
      intent,
      sub,
      pageContext,
      userState: req.userState
    });

    // 5) Risposta al frontend
    res.json({ reply });

    // 6) Log della risposta del bot
    logBotMessage({
      uid,
      type: "bot",
      bot_reply: res.__lastReply || reply,
      intent,
      sub,
      pageContext
    });

    logBotDebug({
      step: "chat_output",
      data: { status: "sent" }
    });

  } catch (err) {
    logBotDebug({
      step: "chat_error",
      data: { error: err.message }
    });

    // 7) Log errore
    logBotMessage({
      uid,
      type: "error",
      error: err.message,
      problem: detectProblemType(err)
    });

    res.status(500).json({ reply: "Errore interno. Riprova tra poco." });
  }
});

/* =========================================================
   PAGINE STATICHE PRINCIPALI
========================================================= */
app.get("/", (req, res) => {
  logBotDebug({ step: "page_home", data: {} });
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================================================
   404 GENERICA
========================================================= */
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

/* =========================================================
   AVVIO SERVER + SYNC AIRTABLE
========================================================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MewingMarket server avviato su porta", PORT);

  logBotDebug({
    step: "server_start",
    data: { port: PORT }
  });

  (async () => {
    try {
      console.log("⏳ Sync Airtable all'avvio...");
      await syncAirtable();
      loadProducts();
      console.log("✅ Sync completata all'avvio");
    } catch (err) {
      console.error("❌ Errore sync all'avvio:", err);
      logBotDebug({ step: "airtable_sync_start_error", data: { error: err.message } });
    }
  })();
});

// Sync programmata ogni 30 minuti
setInterval(async () => {
  try {
    console.log("⏳ Sync programmata Airtable...");
    await syncAirtable();
    loadProducts();
    console.log("✅ Sync programmata completata");
  } catch (err) {
    console.error("❌ Errore sync programmata:", err);
    logBotDebug({ step: "airtable_sync_scheduled_error", data: { error: err.message } });
  }
}, 30 * 60 * 1000);
