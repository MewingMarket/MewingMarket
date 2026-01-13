// ---------------------------------------------
// IMPORT BASE
// ---------------------------------------------
const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { generateNewsletterHTML } = require("./modules/newsletter");
const { syncAirtable, loadProducts, getProducts } = require("./modules/airtable");
const { detectIntent, handleConversation, reply, userStates, generateUID } = require("./modules/bot");
const { inviaNewsletter } = require("./modules/brevo");

// ---------------------------------------------
// SETUP EXPRESS
// ---------------------------------------------
const app = express();
app.disable("x-powered-by");
// 🔥 Anti-cache
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use(express.static(path.join(process.cwd(), "public")));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// Espone products.json
app.get("/products.json", (req, res) => {
  res.sendFile(path.join(process.cwd(), "data", "products.json"));
});

// ---------------------------------------------
// REDIRECT HTTPS + WWW
// ---------------------------------------------
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers.host;

  if (proto !== "https") return res.redirect(301, `https://${host}${req.url}`);
  if (req.hostname === "mewingmarket.it") return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
  if (!host.startsWith("www.")) return res.redirect(301, `https://www.${host}${req.url}`);

  next();
});

// ---------------------------------------------
// USER STATE + COOKIE UID
// ---------------------------------------------
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
    userStates[uid] = { state: "menu", lastIntent: null, data: {} };
  }

  req.uid = uid;
  req.userState = userStates[uid];
  next();
});

// ---------------------------------------------
// SYNC AIRTABLE + CARICAMENTO PRODOTTI
// ---------------------------------------------
loadProducts();

// Sync automatico ogni 5 minuti
setTimeout(() => {
  setInterval(async () => {
    console.log("⏳ Sync automatico Airtable...");
    await syncAirtable();
    loadProducts();
  }, 5 * 60 * 1000);
}, 5000);

// Sync manuale
app.get("/sync/airtable", async (req, res) => {
  try {
    const products = await syncAirtable();
    res.send(`Aggiornamento completato. Prodotti sincronizzati: ${products.length}`);
  } catch (err) {
    console.error("Errore durante la sync manuale:", err);
    res.status(500).send("Errore durante la sincronizzazione.");
  }
});

// ---------------------------------------------
// NEWSLETTER ENDPOINTS
// ---------------------------------------------
app.get("/newsletter/html", (req, res) => {
  const { html } = generateNewsletterHTML();
  res.type("html").send(html);
});

app.get("/newsletter/json", (req, res) => {
  const products = getProducts();
  const latest = products.at(-1);

  if (!latest) {
    return res.json({ error: "Nessun prodotto disponibile" });
  }

  const { html, oggetto } = generateNewsletterHTML();

  res.json({
    oggetto,
    prodotto: latest,
    html
  });
});

app.get("/newsletter/text", (req, res) => {
  const { html } = generateNewsletterHTML();

  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  res.type("text/plain").send(text);
});

// ---------------------------------------------
// INVIO NEWSLETTER (BREVO MCP)
// ---------------------------------------------
app.get("/newsletter/send", async (req, res) => {
  try {
    const products = getProducts();
    const latest = products.at(-1);

    if (!latest) {
      return res.json({ error: "Nessun prodotto disponibile" });
    }

    const { html, oggetto } = generateNewsletterHTML();
    const risultato = await inviaNewsletter({ oggetto, html });

    res.json({
      status: "ok",
      message: "Newsletter inviata",
      campaignId: risultato.campaignId
    });

  } catch (err) {
    console.error("Errore invio newsletter:", err);
    res.status(500).json({ error: "Errore invio newsletter" });
  }
});
// ---------------------------------------------
// META FEED (XML)
// ---------------------------------------------
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
    </item>
`;
  });

  xml += `
  </channel>
</rss>`;

  res.type("application/xml").send(xml);
});


// ---------------------------------------------
// GOOGLE MERCHANT FEED (XML)
// ---------------------------------------------
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
    </item>
`;
  });

  xml += `
  </channel>
</rss>`;

  res.type("application/xml").send(xml);
});const { generateSitemap } = require("./modules/sitemap");

app.get("/sitemap.xml", (req, res) => {
  const xml = generateSitemap();
  res.type("application/xml").send(xml);
});
// ---------------------------------------------
// CHAT ENDPOINT (BOT)
// ---------------------------------------------
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

// ---------------------------------------------
// AVVIO SERVER
// ---------------------------------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`MewingMarket AI attivo sulla porta ${PORT}`);

  // 🔥 Sync all'avvio
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
});// 🔥 Cron job ogni 30 minuti
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
