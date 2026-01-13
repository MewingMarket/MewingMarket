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
// Moduli separati
const { syncAirtable, loadProducts, getProducts } = require("./modules/airtable");
const { detectIntent, handleConversation, reply, userStates, generateUID } = require("./modules/bot");

// ---------------------------------------------
// SETUP EXPRESS
// ---------------------------------------------
const app = express();
app.disable("x-powered-by");

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


app.get("/newsletter/html", (req, res) => {
  const { html } = generateNewsletterHTML();
  res.type("html").send(html);
});app.get("/newsletter/json", (req, res) => {
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
});app.get("/newsletter/text", (req, res) => {
  const { html } = generateNewsletterHTML();

  // Conversione semplice HTML → testo
  const text = html
    .replace(/<[^>]+>/g, " ")   // rimuove tag
    .replace(/\s+/g, " ")       // pulisce spazi
    .trim();

  res.type("text/plain").send(text);
});app.get("/newsletter/send", (req, res) => {
  const products = getProducts();
  const latest = products.at(-1);

  if (!latest) {
    return res.json({ error: "Nessun prodotto disponibile" });
  }

  const { html, oggetto } = generateNewsletterHTML();

  res.json({
    mittente: "vendite@mewingmarket.it",
    oggetto,
    html,
    prodotto: {
      titolo: latest.titoloBreve || latest.titolo,
      descrizione: latest.descrizioneBreve,
      immagine: latest.immagine,
      link: latest.linkPayhip
    }
  });
});const { inviaNewsletter } = require("./modules/brevo");

app.post("/webhook/payhip", express.json(), async (req, res) => {
  try {
    const evento = req.body;
    console.log("📩 Webhook Payhip ricevuto:", evento);

    // Verifica tipo evento (opzionale)
    if (!evento || !evento.product || !evento.product.name) {
      return res.status(400).send("Webhook non valido");
    }

    const { html, oggetto } = generateNewsletterHTML();
    const risultato = await inviaNewsletter({ oggetto, html });

    res.send(`Newsletter inviata. ID campagna: ${risultato.id}`);
  } catch (err) {
    res.status(500).send("Errore invio newsletter");
  }
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
app.listen(PORT, () => console.log(`MewingMarket AI attivo sulla porta ${PORT}`));
