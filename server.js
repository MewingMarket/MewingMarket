import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();
app.disable("x-powered-by");// =========================
// REDIRECT SEO (HTTPS + WWW)
// =========================
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers.host;

  // Forza HTTPS
  if (proto !== "https") {
    return res.redirect(301, `https://${host}${req.url}`);
  }
if (req.hostname === "mewingmarket.it") {
  return res.redirect(301, `https://www.mewingmarket.it${req.url}`);
}
  // Forza www
  if (!host.startsWith("www.")) {
    return res.redirect(301, `https://www.${host}${req.url}`);
  }

  next();
});
// =========================
// CONFIGURAZIONE BASE
// =========================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

// =========================
// MEMORIA RAM PER UTENTI
// =========================
const userStates = {}; 
// struttura: { mm_uid: { state: "menu", lastIntent: null, data: {} } }

// =========================
// GENERATORE ID UTENTE
// =========================
function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

// =========================
// MIDDLEWARE COOKIE + STATO
// =========================
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

// =========================
// FUNZIONI DI SUPPORTO
// =========================
function setState(uid, newState) {
  userStates[uid].state = newState;
}

function reply(res, text) {
  res.json({ reply: text });
}

// =========================
// NORMALIZZAZIONE TESTO
// =========================
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// =========================
// INTENT MATCHER ULTRA 3.0
// =========================
function detectIntent(rawText) {
  const t = normalize(rawText);

  // PRIORITÀ ASSOLUTA SOCIAL
  if (
    t.includes("instagram") ||
    t.includes("tiktok") ||
    t.includes("tik tok") ||
    t.includes("youtube") ||
    t.includes("you tube") ||
    t.includes("facebook") ||
    t.includes("threads") ||
    t.includes("linkedin") ||
    t === "x" ||
    t.includes("twitter") ||
    t.includes("social")
  ) {
    return { intent: "social", sub: null };
  }

  // ACQUISTO — sotto-intenti
  if (t.includes("quanto costa") || t.includes("prezzo") || t.includes("costo") || t.includes("costa")) {
    return { intent: "acquisto", sub: "prezzo" };
  }
  if (t.includes("come pago") || t.includes("pagamento") || t.includes("pago") || t.includes("pagare")) {
    return { intent: "acquisto", sub: "pagamento" };
  }
  if (t.includes("paypal")) {
    return { intent: "acquisto", sub: "paypal" };
  }
  if (t.includes("carta")) {
    return { intent: "acquisto", sub: "carta" };
  }
  if (t.includes("acquista") || t.includes("comprare") || t.includes("compra") || t.includes("checkout")) {
    return { intent: "acquisto", sub: "checkout" };
  }
  if (t.includes("hero")) {
    return { intent: "acquisto", sub: "hero" };
  }

  // SUPPORTO — sotto-intenti
  if (t.includes("download") || t.includes("scaricare") || t.includes("file") || t.includes("zip")) {
    return { intent: "supporto", sub: "download" };
  }
  if (t.includes("errore") || t.includes("non funziona") || t.includes("problema") || t.includes("bug") || t.includes("crash")) {
    return { intent: "supporto", sub: "errore" };
  }
  if (t.includes("pagamento fallito") || t.includes("transazione") || t.includes("rifiutata") || t.includes("rifiutato")) {
    return { intent: "supporto", sub: "pagamento_fallito" };
  }
  if (t.includes("rimborso") || t.includes("refund")) {
    return { intent: "supporto", sub: "rimborso" };
  }
  if (t.includes("email") || t.includes("mail") || t.includes("ricevuta") || t.includes("conferma")) {
    return { intent: "supporto", sub: "email" };
  }
  if (t.includes("file danneggiato") || t.includes("corrotto") || t.includes("zip non si apre")) {
    return { intent: "supporto", sub: "file_danneggiato" };
  }
  if (t.includes("supporto") || t.includes("assistenza") || t.includes("aiuto") || t.includes("help")) {
    return { intent: "supporto", sub: "generale" };
  }

  // NEWSLETTER
  if (t.includes("newsletter") || t.includes("iscrizione") || t.includes("iscrivermi")) {
    return { intent: "newsletter", sub: "iscrizione" };
  }
  if (t.includes("disiscrizione") || t.includes("annulla") || t.includes("cancellami")) {
    return { intent: "newsletter", sub: "disiscrizione" };
  }

  // SITO
  if (t.includes("sito") || t.includes("website") || t.includes("home")) {
    return { intent: "sito", sub: null };
  }

  // VIDEO
  if (t.includes("video") || t.includes("anteprima")) {
    return { intent: "video", sub: null };
  }

  // HERO (informazioni generali)
  if (t.includes("hero")) {
    return { intent: "hero", sub: null };
  }

  // FALLBACK
  return { intent: "fallback", sub: null };
}

// =========================
// ROUTER PRINCIPALE
// =========================
app.post("/chat", (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    return reply(res, "Scrivi un messaggio così posso aiutarti.");
  }

  const uid = req.uid;
  const { intent, sub } = detectIntent(message);

  setState(uid, intent);

  return handleConversation(req, res, intent, sub);
});
// =========================
// LINK UFFICIALI (CTA + link sotto)
// =========================
const LINKS = {
  instagram: `👉 Vai su Instagram  
https://www.instagram.com/mewingmarket?igsh=eGZ2MHE0bTFtbmJt`,

  tiktok: `👉 Vai su TikTok  
https://tiktok.com/@mewingmarket`,

  youtube: `👉 Vai su YouTube  
https://www.youtube.com/@mewingmarket2`,

  facebook: `👉 Vai su Facebook  
https://www.facebook.com/profile.php?id=61584779793628`,

  x: `👉 Vai su X  
https://x.com/mewingm8`,

  threads: `👉 Vai su Threads  
https://www.threads.net/@mewingmarket`,

  linkedin: `👉 Vai su LinkedIn  
https://www.linkedin.com/in/simone-griseri-5368a7394?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app`,

  sito: `👉 Vai al sito  
https://www.mewingmarket.it`,

  store: `👉 Vai allo store  
https://payhip.com/MewingMarket`,

  hero: `👉 Acquista HERO  
https://payhip.com/b/LhqQT`,

  video: `👉 Guarda il video di HERO  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared`,

  newsletter: `👉 Iscriviti alla newsletter  
https://mewingmarket.it/iscrizione.html`,

  disiscrizione: `👉 Annulla iscrizione newsletter  
https://mewingmarket.it/disiscriviti.html`
};

// =========================
// RISPOSTE SPECIFICHE — ACQUISTO
// =========================
const ACQUISTO = {
  prezzo: `
Il prezzo di HERO è 30 euro.

👉 Acquista HERO  
https://payhip.com/b/LhqQT
`,

  pagamento: `
Puoi pagare HERO con PayPal o carta di credito tramite Payhip.

👉 Acquista HERO  
https://payhip.com/b/LhqQT
`,

  paypal: `
Sì, puoi pagare HERO con PayPal.

👉 Acquista HERO  
https://payhip.com/b/LhqQT
`,

  carta: `
Sì, puoi pagare HERO con carta di credito o debito.

👉 Acquista HERO  
https://payhip.com/b/LhqQT
`,

  checkout: `
Perfetto! Puoi acquistare HERO direttamente qui:

👉 Acquista HERO  
https://payhip.com/b/LhqQT
`,

  hero: `
🔥 HERO è il tuo direttore operativo digitale: ti mostra come funziona davvero un ecosistema di prodotti digitali nel 2025.

Vuoi acquistarlo o vuoi vedere il video?

👉 Acquista HERO  
https://payhip.com/b/LhqQT

👉 Guarda il video di HERO  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared
`
};

// =========================
// RISPOSTE SPECIFICHE — SUPPORTO
// =========================
const SUPPORTO = {
  download: `
Per scaricare HERO, dopo l’acquisto ricevi un link immediato via email da Payhip.

Se hai problemi con il download, contattaci qui:
📧 supporto@mewingmarket.it  
📱 WhatsApp Business: 352 026 6660

Ti rispondiamo entro poche ore.
`,

  errore: `
Mi dispiace per il problema, ti aiuto subito.

Scrivici cosa succede qui:
📧 supporto@mewingmarket.it  
📱 WhatsApp Business: 352 026 6660

Ti rispondiamo entro poche ore.
`,

  pagamento_fallito: `
Se il pagamento non va a buon fine, puoi riprovare con PayPal o carta.

Se il problema continua, contattaci:
📧 supporto@mewingmarket.it  
📱 WhatsApp Business: 352 026 6660

Ti rispondiamo entro poche ore.
`,

  rimborso: `
Per richiedere un rimborso, scrivici qui:
📧 supporto@mewingmarket.it  
📱 WhatsApp Business: 352 026 6660

Ti rispondiamo entro poche ore.
`,

  email: `
Se non hai ricevuto l’email, controlla la cartella spam.

Se non c’è nemmeno lì, scrivici:
📧 supporto@mewingmarket.it  
📱 WhatsApp Business: 352 026 6660

Ti rispondiamo entro poche ore.
`,

  file_danneggiato: `
Se il file ZIP non si apre, prova a riscaricarlo.

Se il problema continua:
📧 supporto@mewingmarket.it  
📱 WhatsApp Business: 352 026 6660

Ti rispondiamo entro poche ore.
`,

  generale: `
Sono qui per aiutarti.

Se hai bisogno di assistenza diretta:
📧 supporto@mewingmarket.it  
📱 WhatsApp Business: 352 026 6660

Ti rispondiamo entro poche ore.
`
};

// =========================
// ALTRI BLOCCHI
// =========================
const BLOCKS = {
  hero: `
🔥 HERO è il tuo direttore operativo digitale: ti mostra come funziona davvero un ecosistema di prodotti digitali nel 2025.

👉 Acquista HERO  
https://payhip.com/b/LhqQT

👉 Guarda il video di HERO  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared
`,

  video: `
🎥 Video di presentazione di HERO

👉 Guarda il video di HERO  
https://youtube.com/shorts/YoOXWUajbQc?feature=shared

Vuoi acquistarlo dopo aver visto il video?

👉 Acquista HERO  
https://payhip.com/b/LhqQT
`,

  newsletter: `
✉️ Newsletter MewingMarket

Iscriviti qui:
${LINKS.newsletter}

Se vuoi annullare l’iscrizione:
${LINKS.disiscrizione}
`,

  sito: `
Ecco il sito ufficiale:

${LINKS.sito}

E qui lo store:
${LINKS.store}
`,

  socialMenu: `
🌐 Social MewingMarket

${LINKS.instagram}

${LINKS.tiktok}

${LINKS.youtube}

${LINKS.facebook}

${LINKS.x}

${LINKS.threads}

${LINKS.linkedin}
`
};

// =========================
// PRIORITÀ SOCIAL
// =========================
function handleSocial(text, res) {
  const t = normalize(text);

  if (t.includes("instagram")) return reply(res, LINKS.instagram);
  if (t.includes("tiktok") || t.includes("tik tok")) return reply(res, LINKS.tiktok);
  if (t.includes("youtube") || t.includes("you tube")) return reply(res, LINKS.youtube);
  if (t.includes("facebook")) return reply(res, LINKS.facebook);
  if (t.includes("threads")) return reply(res, LINKS.threads);
  if (t.includes("linkedin")) return reply(res, LINKS.linkedin);
  if (t.includes("x") || t.includes("twitter")) return reply(res, LINKS.x);

  return reply(res, BLOCKS.socialMenu);
  }// =========================
// GESTIONE CONVERSAZIONE
// =========================
function handleConversation(req, res, intent, sub) {
  const uid = req.uid;

  // SOCIAL (priorità assoluta)
  if (intent === "social") {
    return handleSocial(req.body.message, res);
  }

  // ACQUISTO — sotto-intenti
  if (intent === "acquisto") {
    if (sub === "prezzo") return reply(res, ACQUISTO.prezzo);
    if (sub === "pagamento") return reply(res, ACQUISTO.pagamento);
    if (sub === "paypal") return reply(res, ACQUISTO.paypal);
    if (sub === "carta") return reply(res, ACQUISTO.carta);
    if (sub === "checkout") return reply(res, ACQUISTO.checkout);
    if (sub === "hero") return reply(res, ACQUISTO.hero);

    // fallback acquisto → sempre blocco acquisto
    return reply(res, ACQUISTO.checkout);
  }

  // SUPPORTO — sotto-intenti
  if (intent === "supporto") {
    if (sub === "download") return reply(res, SUPPORTO.download);
    if (sub === "errore") return reply(res, SUPPORTO.errore);
    if (sub === "pagamento_fallito") return reply(res, SUPPORTO.pagamento_fallito);
    if (sub === "rimborso") return reply(res, SUPPORTO.rimborso);
    if (sub === "email") return reply(res, SUPPORTO.email);
    if (sub === "file_danneggiato") return reply(res, SUPPORTO.file_danneggiato);
    if (sub === "generale") return reply(res, SUPPORTO.generale);

    // fallback supporto
    return reply(res, SUPPORTO.generale);
  }

  // NEWSLETTER
  if (intent === "newsletter") {
    if (sub === "iscrizione") return reply(res, BLOCKS.newsletter);
    if (sub === "disiscrizione") return reply(res, BLOCKS.newsletter);
    return reply(res, BLOCKS.newsletter);
  }

  // SITO
  if (intent === "sito") {
    return reply(res, BLOCKS.sito);
  }

  // VIDEO
  if (intent === "video") {
    return reply(res, BLOCKS.video);
  }

  // HERO
  if (intent === "hero") {
    return reply(res, BLOCKS.hero);
  }

  // FALLBACK → MENU
  return reply(res, `
Posso aiutarti con:

👉 HERO  
👉 Video  
👉 Acquisto  
👉 Supporto tecnico  
👉 Newsletter  
👉 Social  
👉 Sito

Scrivi una parola chiave, ad esempio: "hero", "video", "social", "newsletter".
`);
}

// =========================
// AVVIO SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MewingMarket AI attivo sulla porta " + PORT);
});
