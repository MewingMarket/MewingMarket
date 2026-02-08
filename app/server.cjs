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
const userStates = {};  /* =========================================================
   MODULI INTERNI
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

/* =========================================================
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
   UID + USER STATE MIDDLEWARE
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
});      /* =========================================================
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
});   /* =========================================================
   ENDPOINT CHAT — INTENT, RISPOSTA, LOGGING
========================================================= */
app.post("/chat", async (req, res) => {
  const body = (req.body && typeof req.body === "object") ? req.body : {};
  const message = body.message || "";
  const pageContext = body.pageContext || null;
  const uid = req.uid;

  try {
    logBotDebug({
      step: "chat_start",
      data: { uid, message, pageContext }
    });

    logBotMessage({
      uid,
      type: "user",
      user_message: message,
      pageContext
    });

    const { intent, sub } = detectIntent(message);

    logBotDebug({
      step: "intent_detected",
      data: { uid, intent, sub }
    });

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (data && data.reply) {
        res.__lastReply = data.reply;
      }
      return originalJson(data);
    };

    const reply = await handleConversation({
      uid,
      message,
      intent,
      sub,
      pageContext,
      userState: req.userState
    });

    res.json({ reply });

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
   FALLBACK HOME
========================================================= */
app.get("/", (req, res) => {
  res.send("MewingMarket Server attivo");
});

/* =========================================================
   AVVIO SERVER
========================================================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server avviato sulla porta " + PORT);
  logBotDebug({
    step: "server_start",
    data: { port: PORT }
  });
});
