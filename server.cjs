/* =========================================================
   IMPORT BASE
========================================================= */
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
const { generateSitemap } = require("./modules/sitemap");

/* =========================================================
   IMPORT SOCIAL BOTS (TUTTO IN /modules)
========================================================= */
const createFacebookBot = require("./modules/facebook");
const createInstagramBot = require("./modules/instagram");
const createThreadsBot = require("./modules/threads");

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

app.use(express.static(path.join(process.cwd(), "public")));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

/* =========================================================
   HOMEPAGE + PRODUCTS.JSON
========================================================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.get("/products.json", (req, res) => {
  res.sendFile(path.join(process.cwd(), "data", "products.json"));
});

/* =========================================================
   FACEBOOK WEBHOOK
========================================================= */
app.get("/webhook/facebook", (req, res) => {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post("/webhook/facebook", async (req, res) => {
  console.log("EVENTO FACEBOOK:", JSON.stringify(req.body, null, 2));
  await facebookBot.handleMessage(req.body);
  res.sendStatus(200);
});

/* =========================================================
   INSTAGRAM WEBHOOK
========================================================= */
app.get("/webhook/instagram", (req, res) => {
  const VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post("/webhook/instagram", (req, res) => {
  console.log("EVENTO INSTAGRAM:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

/* =========================================================
   REDIRECT HTTPS + WWW (DOPO I WEBHOOK)
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
const { iscriviEmail } = require("./modules/brevoSubscribe");
const { disiscriviEmail } = require("./modules/brevoUnsubscribe");app.get("/newsletter/html", (req, res) => {
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
const { iscriviEmail } = require("./modules/brevoSubscribe");
const { disiscriviEmail } = require("./modules/brevoUnsubscribe");

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
   INIZIALIZZA SOCIAL BOTS
========================================================= */
let products = getProducts();

const facebookBot = createFacebookBot({ airtable: { update: syncAirtable }, products });
const instagramBot = createInstagramBot({ airtable: { update: syncAirtable }, products });
const threadsBot = createThreadsBot({ airtable: { update: syncAirtable }, products });

setInterval(() => {
  products = getProducts();
}, 5000);

/* =========================================================
   THREADS CALLBACK
========================================================= */
app.get("/auth/threads/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.THREADS_APP_ID}&client_secret=${process.env.THREADS_APP_SECRET}&redirect_uri=${encodeURIComponent("https://www.mewingmarket.it/auth/threads/callback")}&code=${code}`
    );

    const data = await tokenRes.json();
    console.log("THREADS TOKEN:", data);

    res.send("Autorizzazione completata. Puoi chiudere questa pagina.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante l'autorizzazione Threads");
  }
});

app.post("/threads/uninstall", (req, res) => {
  console.log("THREADS UNINSTALL EVENT:", req.body);
  res.status(200).send("OK");
});

app.post("/threads/delete", (req, res) => {
  console.log("THREADS DELETE REQUEST:", req.body);

  res.status(200).json({
    url: "https://www.mewingmarket.it",
    confirmation_code: "deleted"
  });
});
app.get("/auth/instagram/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  res.send("Instagram autorizzato. Puoi chiudere questa pagina.");
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
   PUBBLICAZIONE AUTOMATICA
========================================================= */
setInterval(async () => {
  console.log("📢 Pubblicazione automatica nuovi prodotti...");

  await facebookBot.publishNewProduct();
  await instagramBot.publishNewProduct();
  await threadsBot.publishNewProduct();

  console.log("✅ Pubblicazione completata");
}, 1000 * 60 * 10);

/* =========================================================
   PUBBLICAZIONE MANUALE
========================================================= */
app.get("/publish/social", async (req, res) => {
  try {
    await facebookBot.publishNewProduct();
    await instagramBot.publishNewProduct();
    await threadsBot.publishNewProduct();

    res.json({ status: "ok", message: "Pubblicazione completata su tutti i social" });
  } catch (err) {
    console.error("Errore pubblicazione social:", err);
    res.status(500).json({ status: "error", message: "Errore durante la pubblicazione" });
  }
});

/* =========================================================
   ENDPOINT META (OAuth + Delete Data)
========================================================= */

// Callback OAuth (GET)
app.get("/oauth/callback", (req, res) => {
  res.status(200).send("OAuth callback OK");
});

// Revoca autorizzazione (GET richiesto da Meta)
app.get("/oauth/revoke", (req, res) => {
  res.status(200).send("Revoca OK");
});

// Revoca autorizzazione (POST)
app.post("/oauth/revoke", (req, res) => {
  console.log("Revoca autorizzazione:", req.body);
  res.status(200).send("Revoca OK");
});

// GDPR Delete Data (GET richiesto da Meta)
app.get("/delete-data", (req, res) => {
  res.status(200).json({
    url: "https://www.mewingmarket.it/delete.html",
    confirmation_code: "delete_12345"
  });
});

// GDPR Delete Data (POST)
app.post("/delete-data", (req, res) => {
  console.log("Richiesta eliminazione dati:", req.body);

  const response = {
    url: "https://www.mewingmarket.it/delete.html",
    confirmation_code: "delete_12345"
  };

  res.status(200).json(response);
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
