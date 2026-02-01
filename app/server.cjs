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

/* =========================================================
   MULTER — UPLOAD FILE CHAT
========================================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = "upload_" + Date.now() + ext;
    cb(null, safeName);
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
  if (!req.file) {
    return res.json({ error: "Nessun file ricevuto" });
  }

  const fileUrl = "/uploads/" + req.file.filename;
  res.json({ fileUrl });
});

/* =========================================================
   STATO UTENTI GLOBALE
========================================================= */
const userStates = {};
/* =========================================================
   IMPORT MODULI INTERNI
========================================================= */
const { generateNewsletterHTML } = require(path.join(__dirname, "modules", "newsletter"));
const { syncAirtable, loadProducts, getProducts } = require(path.join(__dirname, "modules", "airtable"));
const { detectIntent, handleConversation, reply, generateUID } = require(path.join(__dirname, "modules", "bot"));
const { inviaNewsletter } = require(path.join(__dirname, "modules", "brevo"));
/* NUOVE SITEMAP DINAMICHE */
const { generateImagesSitemap } = require(path.join(__dirname, "modules", "sitemap-images"));
const { generateStoreSitemap } = require(path.join(__dirname, "modules", "sitemap-store"));
const { generateSocialSitemap } = require(path.join(__dirname, "modules", "sitemap-social"));
const { generateFooterSitemap } = require(path.join(__dirname, "modules", "sitemap-footer"));

/* =========================================================
   ⭐ IMPORT MAX MODE
========================================================= */
const { safeText } = require(path.join(__dirname, "modules", "utils"));
const Context = require(path.join(__dirname, "modules", "context"));

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
        events: [
          {
            name: eventName,
            params
          }
        ]
      }
    );
  } catch (err) {
    console.error("GA4 tracking error:", err?.response?.data || err);
  }
}

/* =========================================================
   SETUP EXPRESS
========================================================= */
const app = express();
app.disable("x-powered-by");

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
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
/* =========================================================
   REDIRECT HTTPS + WWW (SMART + BLINDATO)
========================================================= */
app.use((req, res, next) => {
  try {
    // Blindatura totale host + proto
    const proto = typeof req.headers["x-forwarded-proto"] === "string"
      ? req.headers["x-forwarded-proto"]
      : null;

    const host = typeof req.headers.host === "string"
      ? req.headers.host
      : "";

    // Se host è vuoto → non fare redirect (evita crash)
    if (!host) return next();

    // Se proto è definito e NON è https → redirect
    if (proto && proto !== "https") {
      return res.redirect(301, `https://${host}${req.url}`);
    }

    // Se host è mewingmarket.it → forza www
    if (host === "mewingmarket.it") {
      return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
    }

    // Se manca www → aggiungilo
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
   USER STATE + COOKIE UID (ULTRA BLINDATO)
========================================================= */
app.use((req, res, next) => {
  let uid = null;

  // Blindatura totale lettura cookie
  try {
    uid = req.cookies && typeof req.cookies.mm_uid === "string"
      ? req.cookies.mm_uid
      : null;
  } catch {
    uid = null;
  }

  // Cookie mancante, corrotto o non valido → rigenera
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
  }

  // Blindatura totale userStates
  if (!userStates || typeof userStates !== "object") {
    console.error("⚠ userStates non inizializzato, ricreo struttura");
  }

  if (!userStates[uid]) {
    userStates[uid] = {
      state: "menu",
      lastIntent: null,
      data: {}
    };
  }

  req.uid = uid;
  req.userState = userStates[uid];

  next();
});

/* =========================================================
   ⭐ MIDDLEWARE MAX: CONTESTO + SANITIZZAZIONE + TRACKING
========================================================= */
app.use((req, res, next) => {
  try {
    const uid = req.uid;

    // Blindatura totale contro req.body e req.query undefined
    if (!req.body || typeof req.body !== "object") req.body = {};
    if (!req.query || typeof req.query !== "object") req.query = {};

    const body = req.body;
    const query = req.query;

    // Blindatura page
    const page =
      typeof body.page !== "undefined"
        ? body.page
        : typeof query.page !== "undefined"
        ? query.page
        : null;

    // Blindatura slug
    const slug =
      typeof body.slug !== "undefined"
        ? body.slug
        : typeof query.slug !== "undefined"
        ? query.slug
        : null;

    if (page || slug) {
      Context.update(uid, page, slug);

      trackGA4("page_view", {
        uid,
        page: page || "",
        slug: slug || ""
      });
    }

    // Blindatura message
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
   SITEMAP DINAMICHE
========================================================= */
app.get("/sitemap-images.xml", (req, res) => {
  try {
    res.type("application/xml").send(generateImagesSitemap());
  } catch (err) {
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
   FEED META
========================================================= */
app.get("/meta/feed", (req, res) => {
  try {
    // Blindatura prodotti
    const products = Array.isArray(getProducts()) ? getProducts() : [];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MewingMarket Catalog</title>
    <link>https://www.mewingmarket.it</link>
    <description>Catalogo prodotti MewingMarket</description>
`;

    products.forEach((p, i) => {
      // Blindatura singolo prodotto
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
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/products.json", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "products.json"));
});
/* =========================================================
   PAGINA PRODOTTO DINAMICA
========================================================= */
app.get("/prodotto.html", (req, res) => {
  try {
    // Blindatura totale query + slug
    const slug = req.query && typeof req.query.slug === "string"
      ? req.query.slug
      : null;

    if (!slug) {
      return res.status(400).send("Parametro slug mancante");
    }

    // Blindatura prodotti
    const products = Array.isArray(getProducts()) ? getProducts() : [];

    const prodotto = products.find(p =>
      p && typeof p === "object" && p.slug === slug
    );

    if (!prodotto) {
      return res.status(404).send("Prodotto non trovato");
    }

    res.sendFile(path.join(__dirname, "public", "prodotto.html"));
  } catch (err) {
    console.error("Errore pagina prodotto:", err);
    res.status(500).send("Errore pagina prodotto");
  }
});


/* =========================================================
   ⭐ CHAT BOT — VERSIONE MAX BLINDATA
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
const { iscriviEmail } = require("./modules/brevoSubscribe");
const { disiscriviEmail } = require("./modules/brevoUnsubscribe");

const welcomeHTML = fs.readFileSync(
  path.join(__dirname, "modules", "welcome.html"),
  "utf8"
);

// ISCRIZIONE
app.post("/newsletter/subscribe", async (req, res) => {
  try {
    // Blindatura email
    const email = req.body && typeof req.body.email === "string"
      ? req.body.email.trim()
      : null;

    if (!email) {
      return res.json({ status: "error", message: "Email mancante" });
    }

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

// DISISCRIZIONE
app.post("/newsletter/unsubscribe", async (req, res) => {
  try {
    // Blindatura email
    const email = req.body && typeof req.body.email === "string"
      ? req.body.email.trim()
      : null;

    if (!email) {
      return res.json({ status: "error", message: "Email mancante" });
    }

    await disiscriviEmail(email);

    return res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Errore disiscrizione newsletter:", err?.response?.data || err);
    return res.json({ status: "error" });
  }
});
// INVIO MANUALE
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

      // Blindatura sync Airtable
      await syncAirtable().catch(err => {
        console.error("❌ Errore sync Airtable all'avvio:", err);
      });

      // Blindatura loadProducts
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

    // Blindatura sync Airtable
    await syncAirtable().catch(err => {
      console.error("❌ Errore sync Airtable programmato:", err);
    });

    // Blindatura loadProducts
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
    // Blindatura prodotti
    const products = Array.isArray(getProducts()) ? getProducts() : [];
    if (products.length === 0) return;

    // Blindatura latest
    const latest = products.length > 0 ? products[products.length - 1] : null;
    if (!latest || typeof latest !== "object") return;

    // Blindatura ID
    const latestId = latest.id || null;
    if (!latestId) return;

    // Primo avvio → memorizza ID
    if (!lastProductId) {
      lastProductId = latestId;
      console.log("🟦 Primo avvio: memorizzato ultimo prodotto:", lastProductId);
      return;
    }

    // Nuovo prodotto rilevato
    if (latestId !== lastProductId) {
      console.log("🆕 Nuovo prodotto rilevato:", latest.titoloBreve || latest.titolo || latestId);

      // Blindatura newsletter HTML
      const { html, oggetto } = generateNewsletterHTML() || {};
      if (!html || !oggetto) {
        console.error("❌ Newsletter non generata: contenuto mancante");
        lastProductId = latestId; // evita loop
        return;
      }

      // Blindatura invio newsletter
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
