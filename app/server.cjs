/* =========================================================
   IMPORT BASE
========================================================= */
const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { generateNewsletterHTML } = require(path.join(__dirname, "modules", "newsletter"));
const { syncAirtable, loadProducts, getProducts } = require(path.join(__dirname, "modules", "airtable"));
const { detectIntent, handleConversation, reply, userStates, generateUID } = require(path.join(__dirname, "modules", "bot"));
const { inviaNewsletter } = require(path.join(__dirname, "modules", "brevo"));
const { generateSitemap } = require(path.join(__dirname, "modules", "sitemap"));

/* =========================================================
   SETUP EXPRESS
========================================================= */
const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// STATICI: ora basati su __dirname dentro /app
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

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
   DEBUG AIRTABLE (DEVE STARE PRIMA DEL REDIRECT)
========================================================= */
app.get("/debug/airtable", async (req, res) => {
  try {
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${process.env.AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.json({ error: String(err) });
  }
});
// Skip redirect for debug endpoint
app.use((req, res, next) => {
  if (req.path === "/debug/airtable") return next();
  next();
});
/* =========================================================
   REDIRECT HTTPS + WWW
========================================================= */
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers.host;

  if (proto !== "https") return res.redirect(301, `https://${host}${req.url}`);
  if (req.hostname === "mewingmarket.it") return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
  if (!host.startsWith("www.")) return res.redirect(301, `https://www.${host}${req.url}`);

  next();
});

/* =========================================================
   USER STATE + COOKIE UID
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
    userStates[uid] = { state: "menu", lastIntent: null, data: {} };
  }

  req.uid = uid;
  req.userState = userStates[uid];
  next();
});

/* =========================================================
   SYNC AIRTABLE
========================================================= */
loadProducts();

setTimeout(() => {
  setInterval(async () => {
    console.log("⏳ Sync automatico Airtable...");
    await syncAirtable();
    loadProducts();
  }, 5 * 60 * 1000);
}, 5000);

app.get("/sync/airtable", async (req, res) => {
  try {
    const products = await syncAirtable();
    res.send(`Aggiornamento completato. Prodotti sincronizzati: ${products.length}`);
  } catch (err) {
    console.error("Errore durante la sync manuale:", err);
    res.status(500).send("Errore durante la sincronizzazione.");
  }
});

/* =========================================================
   NEWSLETTER
========================================================= */
const { iscriviEmail } = require(path.join(__dirname, "modules", "brevoSubscribe"));
const { disiscriviEmail } = require(path.join(__dirname, "modules", "brevoUnsubscribe"));

app.get("/newsletter/html", (req, res) => {
  const { html } = generateNewsletterHTML();
  res.type("html").send(html);
});

app.get("/newsletter/json", (req, res) => {
  const products = getProducts();
  const latest = products.at(-1);

  if (!latest) return res.json({ error: "Nessun prodotto disponibile" });

  const { html, oggetto } = generateNewsletterHTML();

  res.json({ oggetto, prodotto: latest, html });
});

app.get("/newsletter/text", (req, res) => {
  const { html } = generateNewsletterHTML();
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  res.type("text/plain").send(text);
});

app.get("/newsletter/send", async (req, res) => {
  try {
    const products = getProducts();
    const latest = products.at(-1);

    if (!latest) return res.json({ error: "Nessun prodotto disponibile" });

    const { html, oggetto } = generateNewsletterHTML();
    const risultato = await inviaNewsletter({ oggetto, html });

    res.json({ status: "ok", message: "Newsletter inviata", campaignId: risultato.campaignId });
  } catch (err) {
    console.error("Errore invio newsletter:", err);
    res.status(500).json({ error: "Errore invio newsletter" });
  }
});

app.post("/newsletter/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email mancante" });

  try {
    await iscriviEmail(email);
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: "Errore iscrizione" });
  }
});

app.post("/newsletter/unsubscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email mancante" });

  try {
    await disiscriviEmail(email);
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: "Errore disiscrizione" });
  }
});

/* =========================================================
   FEED + SITEMAP
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

app.get("/sitemap.xml", (req, res) => {
  const xml = generateSitemap();
  res.type("application/xml").send(xml);
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
   AVVIO SERVER
========================================================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`MewingMarket AI attivo sulla porta ${PORT}`);

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
