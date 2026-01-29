/* =========================================================
   IMPORT BASE
========================================================= */
const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const axios = require("axios"); // <--- AGGIUNTO
require("dotenv").config();

/* =========================================================
   IMPORT MODULI INTERNI
========================================================= */
const { generateNewsletterHTML } = require(path.join(__dirname, "modules", "newsletter"));
const { syncAirtable, loadProducts, getProducts } = require(path.join(__dirname, "modules", "airtable"));
const { detectIntent, handleConversation, reply, userStates, generateUID } = require(path.join(__dirname, "modules", "bot"));
const { inviaNewsletter } = require(path.join(__dirname, "modules", "brevo"));

/* NUOVE SITEMAP DINAMICHE */
const { generateImagesSitemap } = require(path.join(__dirname, "modules", "sitemap-images"));
const { generateStoreSitemap } = require(path.join(__dirname, "modules", "sitemap-store"));
const { generateSocialSitemap } = require(path.join(__dirname, "modules", "sitemap-social"));
const { generateFooterSitemap } = require(path.join(__dirname, "modules", "sitemap-footer"));

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
   REDIRECT HTTPS + WWW (BLINDATO)
========================================================= */
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers.host;

  if (proto !== "https") {
    return res.redirect(301, `https://${host}${req.url}`);
  }

  if (host === "mewingmarket.it") {
    return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
  }

  if (!host.startsWith("www.")) {
    return res.redirect(301, `https://www.${host}${req.url}`);
  }

  next();
});

/* =========================================================
   USER STATE + COOKIE UID (BLINDATO)
========================================================= */
app.use((req, res, next) => {
  let uid = req.cookies.mm_uid;

  if (!uid) {
    uid = generateUID();
    res.cookie("mm_uid", uid, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 30
    });
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
   SITEMAP DINAMICHE (IMMAGINI + STORE + SOCIAL)
========================================================= */
app.get("/sitemap-images.xml", (req, res) => {
  const xml = generateImagesSitemap();
  res.type("application/xml").send(xml);
});

app.get("/sitemap-store.xml", (req, res) => {
  const xml = generateStoreSitemap();
  res.type("application/xml").send(xml);
});

app.get("/sitemap-social.xml", (req, res) => {
  const xml = generateSocialSitemap();
  res.type("application/xml").send(xml);
});

app.get("/sitemap.xml", (req, res) => {
  const xml = generateFooterSitemap();
  res.type("application/xml").send(xml);
});

/* =========================================================
   FEED META (UNICO FEED UFFICIALE)
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
   PAGINA PRODOTTO DINAMICA (NOINDEX)
========================================================= */
app.get("/prodotto.html", (req, res) => {
  const slug = req.query.slug;
  if (!slug) return res.status(400).send("Parametro slug mancante");

  const products = getProducts();
  const prodotto = products.find(p => p.slug === slug);

  if (!prodotto) return res.status(404).send("Prodotto non trovato");

  res.sendFile(path.join(__dirname, "public", "prodotto.html"));
});

/* =========================================================
   CHAT BOT
========================================================= */
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return reply(res, "Scrivi un messaggio così posso aiutarti.");
  }

  const uid = req.uid;
  const { intent, sub } = detectIntent(message);

  userStates[uid].lastIntent = intent;

  return handleConversation(req, res, intent, sub, message);
});

/* =========================================================
   NEWSLETTER: ISCRIZIONE / DISISCRIZIONE / INVIO
========================================================= */
const { iscriviEmail } = require("./modules/brevoSubscribe");
const { disiscriviEmail } = require("./modules/brevoUnsubscribe");

const welcomeHTML = fs.readFileSync(
  path.join(__dirname, "modules", "welcome.html"),
  "utf8"
);

// 1) ISCRIZIONE
app.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
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
    console.error("❌ Errore iscrizione newsletter:", err.response?.data || err);
    return res.json({ status: "error" });
  }
});

// 2) DISISCRIZIONE
app.post("/newsletter/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ status: "error", message: "Email mancante" });

    await disiscriviEmail(email);

    return res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Errore disiscrizione newsletter:", err.response?.data || err);
    return res.json({ status: "error" });
  }
});

// 3) INVIO MANUALE NEWSLETTER
app.post("/newsletter/send", async (req, res) => {
  try {
    const { html, oggetto } = generateNewsletterHTML();
    const result = await inviaNewsletter({ oggetto, html });
    return res.json({ status: "ok", result });
  } catch (err) {
    console.error("❌ Errore invio newsletter:", err.response?.data || err);
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
      await syncAirtable();
      loadProducts();
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
    await syncAirtable();
    loadProducts();
    console.log("✅ Sync programmato completato");
  } catch (err) {
    console.error("❌ Errore nel sync programmato:", err);
  }
}, 30 * 60 * 1000);
