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
const FormData = require("form-data");

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
  try {
    SERVER_LOGS.push({
      time: new Date().toISOString(),
      event,
      data
    });

    if (SERVER_LOGS.length > 500) SERVER_LOGS.shift();
  } catch (err) {
    console.error("LogEvent error:", err?.message || err);
  }
}

/* =========================================================
   MULTER — UPLOAD FILE CHAT
========================================================= */
const uploadDir = path.join(ROOT, "app", "public", "uploads");

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("📁 Cartella uploads creata:", uploadDir);
  } catch (err) {
    console.error("Errore creazione cartella uploads:", err);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, uploadDir);
    } catch (err) {
      console.error("Errore destination multer:", err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      const ext = path.extname(file.originalname || "");
      cb(null, "upload_" + Date.now() + ext);
    } catch (err) {
      console.error("Errore filename multer:", err);
      cb(err);
    }
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
  try {
    if (!req.file) {
      return res.json({ error: "Nessun file ricevuto" });
    }

    const fileUrl = "/uploads/" + req.file.filename;
    logEvent("chat_file_uploaded", { fileUrl });

    return res.json({ fileUrl });
  } catch (err) {
    console.error("Errore /chat/upload:", err);
    logEvent("chat_file_upload_error", { error: err?.message || "unknown" });
    return res.json({ error: "Errore durante il caricamento del file" });
  }
});

/* =========================================================
   STATO UTENTI GLOBALE
========================================================= */
const userStates = {};

/* =========================================================
   IMPORT MODULI INTERNI
========================================================= */
const { generateNewsletterHTML } = require(path.join(ROOT, "app", "modules", "newsletter.cjs"));

const {
  syncAirtable,
  loadProducts,
  getProducts,
  updateFromPayhip,
  updateFromYouTube,
  saveSaleToAirtable
} = require(path.join(ROOT, "app", "modules", "airtable.cjs"));

const {
  detectIntent,
  handleConversation,
  reply,
  generateUID
} = require(path.join(ROOT, "app", "modules", "bot.cjs"));

const { inviaNewsletter } = require(path.join(ROOT, "app", "modules", "brevo.cjs"));

const { generateImagesSitemap } = require(path.join(ROOT, "app", "modules", "sitemap-images.cjs"));
const { generateStoreSitemap } = require(path.join(ROOT, "app", "modules", "sitemap-store.cjs"));
const { generateSocialSitemap } = require(path.join(ROOT, "app", "modules", "sitemap-social.cjs"));
const { generateFooterSitemap } = require(path.join(ROOT, "app", "modules", "sitemap-footer.cjs"));

const { safeText } = require(path.join(ROOT, "app", "modules", "utils.cjs"));
const Context = require(path.join(ROOT, "app", "modules", "context.cjs"));

const { iscriviEmail } = require(path.join(ROOT, "app", "modules", "brevoSubscribe.cjs"));
const { disiscriviEmail } = require(path.join(ROOT, "app", "modules", "brevoUnsubscribe.cjs"));

let welcomeHTML = "";
try {
  welcomeHTML = fs.readFileSync(
    path.join(ROOT, "app", "modules", "welcome.html"),
    "utf8"
  );
} catch (err) {
  console.error("Errore lettura welcome.html:", err);
  welcomeHTML = "<p>Benvenuto in MewingMarket</p>";
}

/* =========================================================
   TRACKING GA4 SERVER-SIDE
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

    logEvent("ga4_event", { eventName, params });
  } catch (err) {
    console.error("GA4 tracking error:", err?.response?.data || err?.message || err);
    logEvent("ga4_error", { error: err?.message || "unknown", eventName });
  }
}

/* =========================================================
   CACHE HEADERS
========================================================= */
app.use((req, res, next) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } catch (err) {
    console.error("Errore set cache headers:", err);
  } finally {
    next();
  }
});


/* =========================================================
   STATICI — DEVONO ESSERE SERVITI PRIMA DI TUTTO
========================================================= */
app.use(express.static(path.join(ROOT, "app", "public")));


/* =========================================================
   MIDDLEWARE GLOBALI (DOPO GLI STATICI)
========================================================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/payhip', require('./route/payhip.cjs'));
/* =========================================================
   USER STATE + COOKIE UID
========================================================= */
app.use((req, res, next) => {
  try {
    let uid = null;

    try {
      uid = req.cookies?.mm_uid || null;
    } catch {
      uid = null;
    }

    const invalid =
      !uid ||
      typeof uid !== "string" ||
      !uid.startsWith("mm_") ||
      uid.length < 5;

    if (invalid) {
      uid = generateUID();
      res.cookie("mm_uid", uid, {
        httpOnly: false,
        secure: true,
        sameSite: "None",
        maxAge: 1000 * 60 * 60 * 24 * 30
      });
      logEvent("uid_generated", { uid });
    }

    if (!userStates[uid]) {
      userStates[uid] = { state: "menu", lastIntent: null, data: {} };
      logEvent("user_state_init", { uid });
    }

    req.uid = uid;
    req.userState = userStates[uid];

    next();
  } catch (err) {
    console.error("User state middleware error:", err);
    logEvent("user_state_error", { error: err?.message || "unknown" });
    next();
  }
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
      try {
        Context.update(uid, page, slug);
      } catch (err) {
        console.error("Context.update error:", err);
        logEvent("context_update_error", { uid, error: err?.message || "unknown" });
      }

      trackGA4("page_view", { uid, page: page || "", slug: slug || "" });
    }

    if (typeof req.body.message === "string") {
      req.body.message = safeText(req.body.message);
    }

    next();
  } catch (err) {
    console.error("Middleware MAX error:", err);
    logEvent("middleware_max_error", { error: err?.message || "unknown" });
    next();
  }
}); /* =========================================================
   ⭐ WEBHOOK PAYHIP — ENDPOINT CORTO + HEADER
   Accetta:
   - /webhook/payhip-SEGRETO
   - Header: x-payhip-secret
========================================================= */
app.post(`/webhook/payhip-${process.env.PAYHIP_WEBHOOK_SECRET}`, express.json(), async (req, res) => {
  try {
    const headerSecret = req.headers["x-payhip-secret"];
    const urlSecret = process.env.PAYHIP_WEBHOOK_SECRET;

    // Validazione doppia: header O URL
    if (headerSecret && headerSecret !== urlSecret) {
      console.log("❌ Webhook Payhip: header secret errato:", headerSecret);
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    console.log("📦 Webhook Payhip ricevuto:", req.body);

    // 1️⃣ Aggiorna catalogo da Payhip
    try {
      await updateFromPayhip();
      console.log("🔄 Catalogo aggiornato da Payhip");
    } catch (err) {
      console.error("❌ Errore aggiornamento catalogo:", err);
    }

    // 2️⃣ Salva vendita in Airtable
    try {
      await saveSaleToAirtable(req.body);
      console.log("✅ Vendita salvata in Airtable");
    } catch (err) {
      console.error("❌ Errore salvataggio vendita:", err);
    }

    return res.json({ status: "ok" });

  } catch (err) {
    console.error("❌ Errore webhook Payhip:", err);
    return res.status(500).json({ status: "error" });
  }
});
/* =========================================================
   ⭐ WEBHOOK YOUTUBE — AGGIORNA PRODOTTO DA VIDEO
========================================================= */
app.post("/webhook/youtube", express.json(), async (req, res) => {
  try {
    const video = req.body;

    if (!video || !video.title) {
      return res.status(400).json({ status: "error", message: "Video non valido" });
    }

    await updateFromYouTube(video);

    return res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Errore webhook YouTube:", err);
    return res.status(500).json({ status: "error" });
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
    logEvent("api_logs_error", { error: err?.message || "unknown" });
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
    logEvent("api_catalog_error", { error: err?.message || "unknown" });
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
    logEvent("api_system_status_error", { error: err?.message || "unknown" });
    res.status(500).json({ status: "error" });
  }
});

/* =========================================================
   ⭐ API VENDITE PAYHIP → AIRTABLE "Vendite"
========================================================= */
app.get("/api/sales", async (req, res) => {
  try {
    if (req.query.secret !== process.env.DASHBOARD_SECRET) {
      logEvent("api_sales_unauthorized", {});
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE}/Vendite`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const records = response.data?.records || [];

    return res.json(records);
  } catch (err) {
    console.error("Errore /api/sales:", err?.response?.data || err);
    logEvent("api_sales_error", { error: err?.message || "unknown" });
    return res.status(500).json({ status: "error" });
  }
});

app.get("/api/sales/summary", async (req, res) => {
  try {
    if (req.query.secret !== process.env.DASHBOARD_SECRET) {
      logEvent("api_sales_summary_unauthorized", {});
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE}/Vendite`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const sales = response.data?.records || [];
    const products = Array.isArray(getProducts()) ? getProducts() : [];

    const summary = {};

    for (const p of products) {
      try {
        const vendite = sales.filter(s => s.fields?.Prodotto === p.slug);
        const count = vendite.length;

        let score = "red";
        if (count >= 10) score = "green";
        else if (count >= 1) score = "orange";

        summary[p.slug] = {
          titolo: p.titolo,
          vendite: count,
          prezzo: p.prezzo,
          categoria: p.categoria,
          video: Boolean(p.youtube_url),
          descrizioneBreve: Boolean(p.descrizioneBreve),
          score
        };
      } catch (err) {
        console.error("Errore generazione summary prodotto:", err);
        logEvent("api_sales_summary_item_error", {
          product: p?.slug,
          error: err?.message || "unknown"
        });
      }
    }

    return res.json(summary);
  } catch (err) {
    console.error("Errore /api/sales/summary:", err?.response?.data || err);
    logEvent("api_sales_summary_error", { error: err?.message || "unknown" });
    return res.status(500).json({ status: "error" });
  }
});  /* =========================================================
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
      try {
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
      } catch (err) {
        console.error("Errore item feed META:", err);
        logEvent("meta_feed_item_error", { product: p?.slug, error: err?.message });
      }
    });

    xml += `
  </channel>
</rss>`;

    res.type("application/xml").send(xml);
  } catch (err) {
    console.error("Errore feed META:", err);
    logEvent("meta_feed_error", { error: err?.message || "unknown" });
    res.status(500).send("Errore feed");
  }
});

/* =========================================================
   HOMEPAGE + PRODUCTS.JSON
========================================================= */
app.get("/", (req, res) => {
  try {
    res.sendFile(path.join(ROOT, "app", "public", "index.html"));
  } catch (err) {
    console.error("Errore homepage:", err);
    logEvent("homepage_error", { error: err?.message || "unknown" });
    res.status(500).send("Errore homepage");
  }
});

app.get("/products.json", (req, res) => {
  try {
    res.sendFile(path.join(ROOT, "app", "data", "products.json"));
  } catch (err) {
    console.error("Errore products.json:", err);
    logEvent("products_json_error", { error: err?.message || "unknown" });
    res.status(500).send("Errore products.json");
  }
});

/* =========================================================
   PAGINA PRODOTTO DINAMICA
========================================================= */
app.get("/prodotto.html", (req, res) => {
  try {
    const slug = req.query?.slug || null;

    if (!slug) {
      logEvent("product_page_missing_slug", {});
      return res.status(400).send("Parametro slug mancante");
    }

    const products = Array.isArray(getProducts()) ? getProducts() : [];
    const prodotto = products.find(p => p?.slug === slug);

    if (!prodotto) {
      logEvent("product_page_not_found", { slug });
      return res.status(404).send("Prodotto non trovato");
    }

    res.sendFile(path.join(ROOT, "app", "public", "prodotto.html"));
  } catch (err) {
    console.error("Errore pagina prodotto:", err);
    logEvent("product_page_error", { error: err?.message || "unknown" });
    res.status(500).send("Errore pagina prodotto");
  }
}); /* =========================================================
   ⭐ CHAT BOT — TESTO
========================================================= */
app.post("/chat", async (req, res) => {
  try {
    const uid = req.uid;
    const rawMessage = req.body?.message;

    if (!rawMessage || rawMessage.trim() === "") {
      logEvent("chat_empty_message", { uid });
      return reply(res, "Scrivi un messaggio così posso aiutarti.");
    }

    trackGA4("chat_message_sent", { uid, message: rawMessage });

    let intent = "gpt";
    let sub = null;

    try {
      const detected = detectIntent(rawMessage);
      intent = detected.intent;
      sub = detected.sub;
    } catch (err) {
      console.error("Errore detectIntent:", err);
      logEvent("detect_intent_error", { uid, error: err?.message || "unknown" });
    }

    trackGA4("intent_detected", { uid, intent, sub: sub || "" });

    try {
      userStates[uid].lastIntent = intent;
    } catch (err) {
      console.error("Errore set lastIntent:", err);
      logEvent("set_last_intent_error", { uid, error: err?.message || "unknown" });
    }

    const response = await handleConversation(req, res, intent, sub, rawMessage);

    trackGA4("chat_message_received", { uid, intent, sub: sub || "" });

    return response;
  } catch (err) {
    console.error("❌ Errore /chat MAX:", err);
    logEvent("chat_global_error", { error: err?.message || "unknown" });
    trackGA4("chat_error", { error: err?.message || "unknown" });

    return reply(res, "Sto avendo un problema temporaneo. Riprova tra poco.");
  }
});

/* =========================================================
   ⭐ CHAT BOT — VOCALE (WHISPER OPENROUTER)
========================================================= */
app.post("/chat/voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      logEvent("voice_no_file", {});
      return res.json({ reply: "Non ho ricevuto alcun vocale 😅" });
    }

    const filePath = req.file.path;

    // PREPARA FORM-DATA PER OPENROUTER WHISPER
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("model", "openai/whisper-1");

    let transcript = "Non riesco a capire il vocale 😅";

    try {
      const whisperRes = await axios.post(
        "https://openrouter.ai/api/v1/audio/transcriptions",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
          }
        }
      );

      transcript = whisperRes.data?.text || transcript;
      logEvent("voice_transcribed", { transcript });
    } catch (err) {
      console.error("Errore Whisper:", err);
      logEvent("voice_whisper_error", { error: err?.message || "unknown" });
    }

    // PASSA IL TESTO AL BOT
    const uid = req.uid;

    let intent = "gpt";
    let sub = null;

    try {
      const detected = detectIntent(transcript);
      intent = detected.intent;
      sub = detected.sub;
    } catch (err) {
      console.error("Errore detectIntent vocale:", err);
      logEvent("voice_detect_intent_error", { error: err?.message || "unknown" });
    }

    try {
      userStates[uid].lastIntent = intent;
    } catch (err) {
      console.error("Errore set lastIntent vocale:", err);
      logEvent("voice_set_last_intent_error", { error: err?.message || "unknown" });
    }

    return handleConversation(req, res, intent, sub, transcript);

  } catch (err) {
    console.error("❌ Errore vocale:", err);
    logEvent("voice_global_error", { error: err?.message || "unknown" });

    return res.json({ reply: "Non riesco a leggere il vocale 😅" });
  }
}); /* =========================================================
   NEWSLETTER — ISCRIZIONE
========================================================= */
app.post("/newsletter/subscribe", async (req, res) => {
  try {
    const email = req.body?.email?.trim();

    if (!email) {
      logEvent("newsletter_subscribe_missing_email", {});
      return res.json({ status: "error", message: "Email mancante" });
    }

    await iscriviEmail(email);

    try {
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
    } catch (err) {
      console.error("Errore invio email di benvenuto:", err?.response?.data || err);
      logEvent("newsletter_welcome_email_error", { email, error: err?.message || "unknown" });
    }

    logEvent("newsletter_subscribe_ok", { email });
    return res.json({ status: "ok" });

  } catch (err) {
    console.error("❌ Errore iscrizione newsletter:", err?.response?.data || err);
    logEvent("newsletter_subscribe_error", { error: err?.message || "unknown" });
    return res.json({ status: "error" });
  }
});
/* =========================================================
   ⭐ PAYHIP — API CATALOGO AUTOMATICO
========================================================= */

// Scarica catalogo da Payhip
async function fetchPayhipCatalog() {
  try {
    const res = await axios.get("https://payhip.com/api/v1/products", {
      headers: {
        Authorization: `Bearer ${process.env.PAYHIP_API_KEY}`
      }
    });

    const items = res.data?.products || [];
    logEvent("payhip_catalog_fetched", { count: items.length });

    return items.map(p => ({
      id: p.id,
      titolo: p.name,
      prezzo: p.price,
      descrizione: p.description || "",
      immagine: p.thumbnail || "",
      linkPayhip: p.url || "",
      slug: p.slug || p.id
    }));
  } catch (err) {
    console.error("❌ Errore fetchPayhipCatalog:", err?.response?.data || err);
    logEvent("payhip_catalog_error", { error: err?.message || "unknown" });
    return [];
  }
}

// Merge Payhip → Airtable → products.json
async function syncPayhipCatalog() {
  try {
    const payhip = await fetchPayhipCatalog();
    if (!Array.isArray(payhip) || payhip.length === 0) {
      logEvent("payhip_sync_empty", {});
      return;
    }

    // Aggiorna Airtable
    for (const item of payhip) {
      try {
        await updateFromPayhip(item);
      } catch (err) {
        console.error("Errore updateFromPayhip:", err);
      }
    }

    // Ricarica prodotti aggiornati
    try {
      loadProducts();
      logEvent("payhip_sync_ok", { count: payhip.length });
    } catch (err) {
      console.error("Errore loadProducts dopo sync:", err);
      logEvent("payhip_sync_load_error", { error: err?.message || "unknown" });
    }

  } catch (err) {
    console.error("❌ Errore syncPayhipCatalog:", err);
    logEvent("payhip_sync_global_error", { error: err?.message || "unknown" });
  }
} /* =========================================================
   ⭐ YOUTUBE — FEED + SYNC AUTOMATICO
========================================================= */

// Scarica feed YouTube (RSS → JSON)
async function fetchYouTubeFeed() {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${process.env.YOUTUBE_CHANNEL_ID}`;
    const res = await axios.get(url);

    const xml = res.data;
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    const videos = entries.map(e => {
      const block = e[1];

      const get = tag => {
        const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
        return m ? m[1].trim() : "";
      };

      return {
        id: get("yt:videoId"),
        titolo: get("title"),
        link: get("link") || "",
        published: get("published"),
        slug: get("title")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      };
    });

    logEvent("youtube_feed_fetched", { count: videos.length });
    return videos;

  } catch (err) {
    console.error("❌ Errore fetchYouTubeFeed:", err);
    logEvent("youtube_feed_error", { error: err?.message || "unknown" });
    return [];
  }
}

// Merge YouTube → Airtable → products.json
async function syncYouTube() {
  try {
    const videos = await fetchYouTubeFeed();
    if (!Array.isArray(videos) || videos.length === 0) {
      logEvent("youtube_sync_empty", {});
      return;
    }

    for (const v of videos) {
      try {
        await updateFromYouTube(v);
      } catch (err) {
        console.error("Errore updateFromYouTube:", err);
      }
    }

    try {
      loadProducts();
      logEvent("youtube_sync_ok", { count: videos.length });
    } catch (err) {
      console.error("Errore loadProducts dopo sync YouTube:", err);
      logEvent("youtube_sync_load_error", { error: err?.message || "unknown" });
    }

  } catch (err) {
    console.error("❌ Errore syncYouTube:", err);
    logEvent("youtube_sync_global_error", { error: err?.message || "unknown" });
  }
} 
/* =========================================================
   NEWSLETTER — DISISCRIZIONE
========================================================= */
app.post("/newsletter/unsubscribe", async (req, res) => {
  try {
    const email = req.body?.email?.trim();

    if (!email) {
      logEvent("newsletter_unsubscribe_missing_email", {});
      return res.json({ status: "error", message: "Email mancante" });
    }

    await disiscriviEmail(email);

    logEvent("newsletter_unsubscribe_ok", { email });
    return res.json({ status: "ok" });

  } catch (err) {
    console.error("❌ Errore disiscrizione newsletter:", err?.response?.data || err);
    logEvent("newsletter_unsubscribe_error", { error: err?.message || "unknown" });
    return res.json({ status: "error" });
  }
});

/* =========================================================
   NEWSLETTER — INVIO MASSIVO
========================================================= */
app.post("/newsletter/send", async (req, res) => {
  try {
    const { html, oggetto } = generateNewsletterHTML();

    if (!html || !oggetto) {
      logEvent("newsletter_send_missing_content", {});
      return res.json({ status: "error", message: "Contenuto newsletter mancante" });
    }

    const result = await inviaNewsletter({ oggetto, html });

    logEvent("newsletter_send_ok", { oggetto });
    return res.json({ status: "ok", result });

  } catch (err) {
    console.error("❌ Errore invio newsletter:", err?.response?.data || err);
    logEvent("newsletter_send_error", { error: err?.message || "unknown" });
    return res.json({ status: "error" });
  }
}); /* =========================================================
   AVVIO SERVER
========================================================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 MewingMarket attivo sulla porta ${PORT}`);

  (async () => {
    try {
      console.log("⏳ Sync automatico Airtable all'avvio...");

      await syncAirtable().catch(err => {
        console.error("❌ Errore sync Airtable all'avvio:", err);
        logEvent("sync_airtable_start_error", { error: err?.message || "unknown" });
      });

      try {
        loadProducts();
      } catch (err) {
        console.error("❌ Errore loadProducts all'avvio:", err);
        logEvent("load_products_start_error", { error: err?.message || "unknown" });
      }

      console.log("✅ Sync completato all'avvio");
      logEvent("startup_sync_ok", {});

    } catch (err) {
      console.error("❌ Errore nel sync all'avvio:", err);
      logEvent("startup_global_error", { error: err?.message || "unknown" });
    }
  })();
});
/* =========================================================
   ⭐ CRON JOB — PAYHIP + YOUTUBE
========================================================= */

// Sync Payhip ogni 10 minuti
setInterval(async () => {
  try {
    console.log("⏳ Sync Payhip programmato...");
    await syncPayhipCatalog();
    console.log("✅ Sync Payhip completato");
    logEvent("cron_payhip_ok", {});
  } catch (err) {
    console.error("❌ Errore cron Payhip:", err);
    logEvent("cron_payhip_error", { error: err?.message || "unknown" });
  }
}, 10 * 60 * 1000);

// Sync YouTube ogni 10 minuti
setInterval(async () => {
  try {
    console.log("⏳ Sync YouTube programmato...");
    await syncYouTube();
    console.log("🎥 Sync YouTube completato");
    logEvent("cron_youtube_ok", {});
  } catch (err) {
    console.error("❌ Errore cron YouTube:", err);
    logEvent("cron_youtube_error", { error: err?.message || "unknown" });
  }
}, 10 * 60 * 1000);
/* =========================================================
   SYNC PROGRAMMATA
========================================================= */
setInterval(async () => {
  try {
    console.log("⏳ Sync programmato Airtable...");

    await syncAirtable().catch(err => {
      console.error("❌ Errore sync Airtable programmato:", err);
      logEvent("sync_airtable_interval_error", { error: err?.message || "unknown" });
    });

    try {
      loadProducts();
    } catch (err) {
      console.error("❌ Errore loadProducts programmato:", err);
      logEvent("load_products_interval_error", { error: err?.message || "unknown" });
    }

    console.log("✅ Sync programmato completato");
    logEvent("interval_sync_ok", {});

  } catch (err) {
    console.error("❌ Errore nel sync programmato:", err);
    logEvent("interval_global_error", { error: err?.message || "unknown" });
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

    // Primo avvio → inizializza
    if (!lastProductId) {
      lastProductId = latestId;
      console.log("🟦 Primo sync prodotti completato");
      logEvent("first_product_sync", { latestId });
      return;
    }

    // Nuovo prodotto rilevato
    if (latestId !== lastProductId) {
      lastProductId = latestId;

      console.log("🟩 Nuovo prodotto rilevato:", latest.titolo || latest.slug || latestId);
      logEvent("new_product_detected", {
        id: latestId,
        titolo: latest.titolo || null,
        slug: latest.slug || null
      });

      // Qui puoi agganciare invio newsletter automatica
    }

  } catch (err) {
    console.error("❌ Errore checkNewProduct:", err);
    logEvent("check_new_product_error", { error: err?.message || "unknown" });
  }
}

setInterval(checkNewProduct, 5 * 60 * 1000);
