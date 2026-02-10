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
   ROOT ASSOLUTA DEL PROGETTO
========================================================= */
const ROOT = path.resolve(__dirname, "..");

/* =========================================================
   SETUP EXPRESS
========================================================= */
const app = express();
app.disable("x-powered-by");

/* =========================================================
   LOG SERVER-SIDE (per dashboard interna)
========================================================= */
const SERVER_LOGS = [];
function logEvent(event, data = {}) {
  SERVER_LOGS.push({
    time: new Date().toISOString(),
    event,
    data
  });

  // Mantieni massimo 500 eventi
  if (SERVER_LOGS.length > 500) SERVER_LOGS.shift();
}

/* =========================================================
   MULTER — UPLOAD FILE CHAT
========================================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(ROOT, "app", "public", "uploads")),
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
   IMPORT MODULI INTERNI (PERCORSI ASSOLUTI)
========================================================= */
const { generateNewsletterHTML } = require(path.join(ROOT, "app", "modules", "newsletter.cjs"));

const {
  syncAirtable,
  loadProducts,
  getProducts,
  updateFromPayhip   // AGGIUNTO
} = require(path.join(ROOT, "app", "modules", "airtable.cjs"));

const { detectIntent, handleConversation, reply, generateUID } = require(path.join(ROOT, "app", "modules", "bot.cjs"));
const { inviaNewsletter } = require(path.join(ROOT, "app", "modules", "brevo.cjs"));

const { generateImagesSitemap } = require(path.join(ROOT, "app", "modules", "sitemap-images.cjs"));
const { generateStoreSitemap } = require(path.join(ROOT, "app", "modules", "sitemap-store.cjs"));
const { generateSocialSitemap } = require(path.join(ROOT, "app", "modules", "sitemap-social.cjs"));
const { generateFooterSitemap } = require(path.join(ROOT, "app", "modules", "sitemap-footer.cjs"));

const { safeText } = require(path.join(ROOT, "app", "modules", "utils.cjs"));
const Context = require(path.join(ROOT, "app", "modules", "context.cjs"));

const { iscriviEmail } = require(path.join(ROOT, "app", "modules", "brevoSubscribe.cjs"));
const { disiscriviEmail } = require(path.join(ROOT, "app", "modules", "brevoUnsubscribe.cjs"));

const welcomeHTML = fs.readFileSync(
  path.join(ROOT, "app", "modules", "welcome.html"),
  "utf8"
);

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

    logEvent("ga4_event", { eventName, params });
  } catch (err) {
    console.error("GA4 tracking error:", err?.response?.data || err);
    logEvent("ga4_error", { error: err?.message || "unknown" });
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
   STATICI + MIDDLEWARE
========================================================= */
app.use(express.static(path.join(ROOT, "app", "public")));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

/* =========================================================
   REDIRECT HTTPS + WWW
========================================================= */
app.use((req, res, next) => {
  try {
    const proto = req.headers["x-forwarded-proto"];
    const host = req.headers.host || "";

    if (!host) return next();
    if (proto && proto !== "https") return res.redirect(301, `https://${host}${req.url}`);
    if (host === "mewingmarket.it") return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
    if (!host.startsWith("www.")) return res.redirect(301, `https://www.${host}${req.url}`);

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

  const invalid = !uid || typeof uid !== "string" || !uid.startsWith("mm_") || uid.length < 5;

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
   ⭐ MIDDLEWARE MAX
========================================================= */
app.use((req, res, next) => {
  try {
    const uid = req.uid;
    req.body = req.body || {};
    req.query = req.query || {};

    const page = req.body.page ?? req.query.page ?? null;
    const slug = req.body.slug ?? req.query.slug ?? null;

    if (page || slug) {
      Context.update(uid, page, slug);
      trackGA4("page_view", { uid, page: page || "", slug: slug || "" });
    }

    if (typeof req.body.message === "string") {
      req.body.message = safeText(req.body.message);
    }

    next();
  } catch (err) {
    console.error("Middleware MAX error:", err);
    next();
  }
});

/* =========================================================
   SITEMAP DINAMICHE
========================================================= */
app.get("/sitemap-images.xml", (req, res) => {
  try {
    res.type("application/xml").send(generateImagesSitemap());
  } catch {
    res.status(500).send("Errore sitemap");
  }
});

app.get("/sitemap-store.xml", (req, res) => {
  try {
    res.type("application/xml").send(generateStoreSitemap());
  } catch {
    res.status(500).send("Errore sitemap");
  }
});

app.get("/sitemap-social.xml", (req, res) => {
  try {
    res.type("application/xml").send(generateSocialSitemap());
  } catch {
    res.status(500).send("Errore sitemap");
  }
});

app.get("/sitemap.xml", (req, res) => {
  try {
    res.type("application/xml").send(generateFooterSitemap());
  } catch {
    res.status(500).send("Errore sitemap");
  }
});

/* =========================================================
   ⭐ WEBHOOK PAYHIP — BLINDATO
========================================================= */
app.post("/webhook/payhip", express.json(), (req, res) => {
  try {
    const secret = req.query?.secret || null;
    const expected = process.env.PAYHIP_WEBHOOK_SECRET;

    if (!secret || !expected || secret !== expected) {
      logEvent("payhip_unauthorized", { ip: req.ip });
      return res.status(401).send("Unauthorized");
    }

    const body = req.body || {};
    const event = body.event || "unknown";
    const data = body.data || {};

    logEvent("payhip_webhook", { event, slug: data.slug });

    trackGA4("payhip_webhook", {
      event,
      slug: data.slug || "",
      price: data.price || "",
      uid: "server"
    });

    if (data.slug) {
      updateFromPayhip({
        slug: data.slug,
        price: data.price,
        title: data.title,
        image: data.image,
        url: data.url
      });
    }

    return res.json({ status: "ok" });

  } catch (err) {
    console.error("❌ Errore webhook Payhip:", err);
    logEvent("payhip_error", { error: err?.message || "unknown" });
    return res.status(500).send("Errore webhook");
  }
});

/* =========================================================
   ⭐ API DASHBOARD INTERNA
========================================================= */
app.get("/api/logs", (req, res) => {
  try {
    res.json({
      status: "ok",
      logs: SERVER_LOGS
    });
  } catch (err) {
    console.error("Errore /api/logs:", err);
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/catalog", (req, res) => {
  try {
    const products = Array.isArray(getProducts()) ? getProducts() : [];
    res.json({
      status: "ok",
      count: products.length,
      products
    });
  } catch (err) {
    console.error("Errore /api/catalog:", err);
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/system-status", (req, res) => {
  try {
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: {
        airtable: Boolean(process.env.AIRTABLE_PAT),
        payhip_secret: Boolean(process.env.PAYHIP_WEBHOOK_SECRET),
        ga4: Boolean(process.env.GA4_ID && process.env.GA4_API_SECRET)
      }
    });
  } catch (err) {
    console.error("Errore /api/system-status:", err);
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/sales", (req, res) => {
  res.json({
    status: "ok",
    message: "Endpoint pronto per integrazione vendite Payhip"
  });
});

/* =========================================================
   FEED META
========================================================= */
app.get("/meta/feed", (req, res) => {
  try {
    const products = Array.isArray(getProducts()) ? getProducts() : [];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MewingMarket Catalog</title>
    <link>https://www.mewingmarket.it</link>
    <description>Catalogo prodotti MewingMarket</description>
`;

    products.forEach((p, i) => {
      if (!p || typeof p !== "object") return;

      xml += `
    <item>
      <g:id>${p.id || i + 1}</g:id>
      <g:title><![CDATA[${p.titoloBreve || p.titolo || ""}]]></g:title>
      <g:description><![CDATA[${p.descrizioneBreve || p.descrizione || ""}]]></g:description>
      <g:link>${p.linkPayhip || ""}</g:link>
      <g:image_link>${p.immagine || ""}</g:image_link>
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
  } catch (err) {
    console.error("Errore feed META:", err);
    res.status(500).send("Errore feed");
  }
});

/* =========================================================
   HOMEPAGE + PRODUCTS.JSON
========================================================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "app", "public", "index.html"));
});

app.get("/products.json", (req, res) => {
  res.sendFile(path.join(ROOT, "app", "data", "products.json"));
});

/* =========================================================
   PAGINA PRODOTTO DINAMICA
========================================================= */
app.get("/prodotto.html", (req, res) => {
  try {
    const slug = req.query?.slug || null;
    if (!slug) return res.status(400).send("Parametro slug mancante");

    const products = Array.isArray(getProducts()) ? getProducts() : [];
    const prodotto = products.find(p => p?.slug === slug);

    if (!prodotto) return res.status(404).send("Prodotto non trovato");

    res.sendFile(path.join(ROOT, "app", "public", "prodotto.html"));
  } catch (err) {
    console.error("Errore pagina prodotto:", err);
    res.status(500).send("Errore pagina prodotto");
  }
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
    trackGA4("intent_detected", { uid, intent, sub: sub || "" });

    userStates[uid].lastIntent = intent;

    const response = await handleConversation(req, res, intent, sub, rawMessage);

    trackGA4("chat_message_received", { uid, intent, sub: sub || "" });

    return response;
  } catch (err) {
    console.error("❌ Errore /chat MAX:", err);
    trackGA4("chat_error", { error: err?.message || "unknown" });
    return reply(res, "Sto avendo un problema temporaneo. Riprova tra poco.");
  }
});

/* =========================================================
   NEWSLETTER
========================================================= */
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
    console.error("❌ Errore iscrizione newsletter:", err?.response?.data || err);
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
    console.error("❌ Errore disiscrizione newsletter:", err?.response?.data || err);
    return res.json({ status: "error" });
  }
});

app.post("/newsletter/send", async (req, res) => {
  try {
    const { html, oggetto } = generateNewsletterHTML();
    if (!html || !oggetto) {
      return res.json({ status: "error", message: "Contenuto newsletter mancante" });
    }

    const result = await inviaNewsletter({ oggetto, html });
    return res.json({ status: "ok", result });
  } catch (err) {
    console.error("❌ Errore invio newsletter:", err?.response?.data || err);
    return res.json({ status: "error" });
  }
});

/* =========================================================
   AVVIO SERVER
========================================================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`MewingMarket attivo sulla porta ${PORT}`);

  (async () => {
    try {
      console.log("⏳ Sync automatico Airtable all'avvio...");

      await syncAirtable().catch(err => console.error("❌ Errore sync Airtable all'avvio:", err));

      try {
        loadProducts();
      } catch (err) {
        console.error("❌ Errore loadProducts all'avvio:", err);
      }

      console.log("✅ Sync completato all'avvio");
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

    await syncAirtable().catch(err => console.error("❌ Errore sync Airtable programmato:", err));

    try {
      loadProducts();
    } catch (err) {
      console.error("❌ Errore loadProducts programmato:", err);
    }

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
    const products = Array.isArray(getProducts()) ? getProducts() : [];
    if (products.length === 0) return;

    const latest = products[products.length - 1];
    if (!latest || typeof latest !== "object") return;

    const latestId = latest.id || null;
    if (!latestId) return;

    if (!lastProductId) {
      lastProductId = latestId;
      console.log("🟦 Primo avvio: memorizzato ultimo prodotto:", lastProductId);
      return;
    }

    if (latestId !== lastProductId) {
      console.log("🆕 Nuovo prodotto rilevato:", latest.titoloBreve || latest.titolo || latestId);

      const { html, oggetto } = generateNewsletterHTML() || {};
      if (!html || !oggetto) {
        console.error("❌ Newsletter non generata: contenuto mancante");
        lastProductId = latestId;
        return;
      }

      try {
        await inviaNewsletter({ oggetto, html });
        console.log("📨 Newsletter nuovo prodotto inviata");
      } catch (err) {
        console.error("❌ Errore invio newsletter nuovo prodotto:", err?.response?.data || err);
      }

      lastProductId = latestId;
    }
  } catch (err) {
    console.error("❌ Errore controllo nuovo prodotto:", err?.response?.data || err);
  }
}

setInterval(checkNewProduct, 5 * 60 * 1000);
