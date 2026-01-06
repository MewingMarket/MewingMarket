

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();
app.use(cors({ origin: ["https://mewingmarket.it", "https://www.mewingmarket.it"], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

// =========================
// MEMORIA RAM PER UTENTI
// =========================
const userStates = {}; // { mm_uid: { state: "...", lastIntent: "...", data: {} } }

// =========================
// GENERATORE ID UTENTE
// =========================
function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

// =========================
// MIDDLEWARE COOKIE
// =========================
app.use((req, res, next) => {
  let uid = req.cookies.mm_uid;
  if (!uid) {
    uid = generateUID();
    res.cookie("mm_uid", uid, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 giorni
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
// FUNZIONE CAMBIO STATO
// =========================
function setState(uid, newState) {
  userStates[uid].state = newState;
}

// =========================
// RISPOSTA STANDARD
// =========================
function reply(res, text) {
  res.json({ reply: text });
}

// =========================
// ROUTER PRINCIPALE /chat
// =========================
app.post("/chat", (req, res) => {
  const { message } = req.body;
  const uid = req.uid;
  const state = req.userState.state;

  if (!message || message.trim() === "") {
    return reply(res, "❌ Messaggio vuoto, scrivi qualcosa.");
  }

  const text = message.toLowerCase();

  // INTENTI PRINCIPALI
  const intents = {
    hero: ["hero", "prodotto", "acquistare", "comprare", "prezzo", "template", "ebook"],
    video: ["video", "vedere", "anteprima", "presentazione"],
    acquisto: ["acquisto", "comprare", "acquista", "vorrei acquistare"],
    supporto: ["supporto", "assistenza", "problema", "errore", "download", "payhip", "tecnico", "rimborso"],
    newsletter: ["newsletter", "iscrizione", "email", "aggiornamenti", "news", "disiscrizione"],
    social: ["social", "instagram", "tiktok", "youtube", "facebook", "x", "twitter"],
    sito: ["sito", "website", "pagina", "home"],
    fallback: ["non so", "boh", "aiuto", "info", "domanda generica"]
  };

  // FUNZIONE MATCH INTENT
  function matchIntent() {
    for (const [intent, keys] of Object.entries(intents)) {
      if (keys.some(k => text.includes(k))) return intent;
    }
    return "fallback";
  }

  const intent = matchIntent();
  req.userState.lastIntent = intent;

  // PASSO ALLA PARTE 2 (blocchi conversazionali)
  return handleConversation(req, res, intent, text);
});// =========================
// LOGICA CONVERSAZIONALE
// =========================
function handleConversation(req, res, intent, text) {
  const uid = req.uid;
  const state = req.userState.state;
// =========================
// PRIORITÀ SOCIAL (match diretto)
// =========================
if (
  text.includes("instagram") ||
  text.includes("tiktok") ||
  text.includes("youtube") ||
  text.includes("facebook") ||
  text.includes("x ") || text === "x" ||
  text.includes("twitter")
) {
  setState(req.uid, "social");

  if (text.includes("instagram")) return reply(res, socialLinks.instagram);
  if (text.includes("tiktok")) return reply(res, socialLinks.tiktok);
  if (text.includes("youtube")) return reply(res, socialLinks.youtube);
  if (text.includes("facebook")) return reply(res, socialLinks.facebook);
  if (text.includes("x") || text.includes("twitter")) return reply(res, socialLinks.x);

  return reply(res, socialBloc);
}
  // --- BLOCCHI DI TESTO PRONTI ---

  // HERO – descrizione commerciale
  const heroDescrizione = `
🔥 <b>HERO</b> è il tuo direttore operativo digitale: ti mostra come funziona davvero un ecosistema di prodotti digitali nel 2025, senza scorciatoie e senza fuffa.<br><br>
All'interno trovi:<br>
- La storia dell'IA: dai miti antichi a ChatGPT, Copilot e Gemini<br>
- Cosa è davvero un prodotto digitale (e cosa non è)<br>
- Analisi di mercato e competitor<br>
- Guida completa agli strumenti chiave (IA, Notion, Canva, Metricool, GA4 + Perplexity, Make, Payhip, Shopify, Gumroad, sito, DNS, hosting, automazioni, marketing reale, costi e tempi veri)<br>
- Come evitare la fuffa e costruire qualcosa di solido<br><br>
In più hai:<br>
- Mini-corso video chiaro e diretto<br>
- Checklist operativa in PDF: dal nulla al tuo primo prodotto digitale<br>
- Formato ZIP 2×1: scarichi tutto in un unico file.<br><br>
È pensato per chi vuole autonomia, chiarezza e risultati realistici, non promesse da guru.
`;

  const heroPerche = `
✅ <b>Perché acquistare HERO?</b><br>
- Ti risparmia mesi di tentativi alla cieca<br>
- Ti mostra strumenti, costi e tempi reali, senza frasi motivazionali vuote<br>
- Ti dà un metodo chiaro, replicabile e concreto<br>
- Ti evita anni di fuffa, corsi inutili e illusioni sul "soldi in 24 ore"<br><br>
<b>Prezzo:</b> 30 euro<br>
<b>Pagamento:</b> puoi pagare con PayPal e altri metodi supportati da Payhip.<br><br>
Puoi acquistarlo qui:<br>
👉 <a href="https://mewingmarket.payhip.com/b/hero" target="_blank">Acquista HERO su Payhip</a><br><br>
Vuoi prima dare un’occhiata allo store completo?<br>
👉 <a href="https://payhip.com/MewingMarket" target="_blank">Visita lo store MewingMarket</a><br><br>
Per non perdere aggiornamenti e nuovi prodotti puoi:<br>
- Iscriverti alla newsletter<br>
- Seguirci sui social
`;

  // HERO – video presentazione
  const heroVideo = `
🎥 <b>Video di presentazione di HERO</b><br><br>
In questo video ti mostriamo la logica dell’ecosistema digitale, gli strumenti fondamentali e i passaggi reali per partire, senza promesse irrealistiche.<br><br>
👉 <a href="https://mewingmarket.payhip.com/b/hero-video" target="_blank">Guarda il video di presentazione</a><br><br>
Se dopo il video vuoi acquistare HERO, scrivi pure: "voglio acquistare HERO".
`;

  const invitoAcquistoDopoVideo = `
Ti è chiaro dopo il video?<br><br>
Se vuoi procedere all’acquisto:<br>
👉 <a href="https://mewingmarket.payhip.com/b/hero" target="_blank">Acquista HERO (30 euro)</a><br><br>
Se invece hai bisogno di altre informazioni su HERO o supporto tecnico, scrivimi pure la tua domanda.
`;

  const invitoFinaleHero = `
Perfetto. Prima di chiudere, se vuoi puoi:<br>
- Iscriverti alla newsletter: <a href="https://mewingmarket.it/iscrizione.html" target="_blank">Iscriviti alla newsletter</a><br>
- Visitare lo store: <a href="https://payhip.com/MewingMarket" target="_blank">Store MewingMarket</a><br>
- Seguirci sui social (Instagram, TikTok, YouTube, Facebook, X)<br><br>
Se ti serve altro, scrivi pure: ti riporto al blocco giusto.
`;

  // SUPPORTO – help desk
  const supportDownload = `
📥 <b>Non riesco a scaricare HERO</b><br><br>
Segui questi passaggi:<br>
1️⃣ Controlla la tua email: dopo l’acquisto ricevi un’email con il link di download (guarda anche in spam o promozioni).<br>
2️⃣ Verifica di usare la stessa email che hai usato per l’acquisto.<br>
3️⃣ Se non trovi l’email, accedi alla tua area Payhip con la stessa email: troverai lì i tuoi acquisti.<br>
4️⃣ Se il link non funziona, prova con un altro browser o dispositivo.<br><br>
Se dopo questi passaggi hai ancora problemi, contattaci e ti inviamo subito un nuovo link:<br>
📧 supporto@mewingmarket.it<br>
📱 WhatsApp: 352 026 6660
`;

  const supportPayhip = `
💾 <b>Come funziona Payhip per i download digitali</b><br><br>
Payhip è la piattaforma che gestisce pagamenti e download in modo sicuro.<br><br>
- Dopo il pagamento ricevi immediatamente un’email con il link per scaricare il prodotto<br>
- Il link è personale e sicuro<br>
- Puoi accedere ai tuoi acquisti anche dalla tua area Payhip usando la stessa email usata per l’acquisto<br>
- Il download è immediato e non richiede installazioni particolari<br><br>
Se hai qualsiasi problema con Payhip, scrivici in chat o contattaci:<br>
📧 supporto@mewingmarket.it<br>
📱 WhatsApp: 352 026 6660
`;

  const supportRimborso = `
💸 <b>Politica di rimborso per i prodotti digitali</b><br><br>
I prodotti digitali non prevedono rimborso una volta scaricati, come da normativa sui contenuti digitali.<br><br>
Tuttavia, se hai problemi tecnici con il download o non riesci ad accedere al prodotto, contattaci e ti aiutiamo immediatamente a risolvere:<br>
📧 supporto@mewingmarket.it<br>
📱 WhatsApp: 352 026 6660
`;

  const supportContatto = `
📞 <b>Come contattare il supporto</b><br><br>
Puoi contattarci direttamente da qui, oppure usare questi canali:<br>
- Problemi di download<br>
- Informazioni sui prodotti<br>
- Assistenza sugli acquisti<br>
- Domande tecniche su sito, social o store<br><br>
📧 Email: supporto@mewingmarket.it<br>
📱 WhatsApp: 352 026 6660<br><br>
Rispondiamo il prima possibile e ti guidiamo passo dopo passo.
`;

  const supportNewsletterInfo = `
📰 <b>Come funziona la newsletter di MewingMarket</b><br><br>
La newsletter ti permette di ricevere aggiornamenti, contenuti utili e novità sui prodotti.<br><br>
Puoi iscriverti:<br>
- dalla chat del sito<br>
- dalle pagine del sito<br>
- dai link presenti nei nostri contenuti<br><br>
L’iscrizione è gratuita e puoi annullarla in qualsiasi momento.
`;

  const supportGenerico = `
Sono qui per aiutarti 💬<br><br>
Puoi chiedermi ad esempio:<br>
- Non riesco a scaricare HERO<br>
- Come funziona Payhip<br>
- Come funzionano i rimborsi<br>
- Come contattare il supporto<br>
- Come funziona la newsletter<br><br>
Se la chat non basta, puoi sempre contattare direttamente:<br>
📧 supporto@mewingmarket.it<br>
📱 WhatsApp: 352 026 6660
`;

  // NEWSLETTER
  const newsletterIscrizione = `
✉️ <b>Newsletter MewingMarket</b><br><br>
Iscrivendoti alla newsletter riceverai contenuti utili, aggiornamenti sui prodotti e novità importanti.<br><br>
👉 <a href="https://mewingmarket.it/iscrizione.html" target="_blank">Clicca qui per iscriverti</a><br><br>
Dopo l’iscrizione, se vuoi, posso aiutarti anche con HERO o con il supporto tecnico.
`;

  const newsletterDisiscrizione = `
🧹 <b>Annullare l’iscrizione alla newsletter</b><br><br>
Se vuoi annullare l’iscrizione, puoi farlo in qualsiasi momento da questa pagina:<br><br>
👉 <a href="https://mewingmarket.it/disiscriviti.html" target="_blank">Disiscriviti dalla newsletter</a><br><br>
Se c’è qualcosa che non ti è stato utile o ti ha dato fastidio, puoi raccontarmelo: ci aiuta a migliorare.
`;

  // SOCIAL E SITO
  const socialLinks = {
    instagram: `📸 Instagram<br><a href="https://www.instagram.com/mewingmarket" target="_blank">Vai al profilo Instagram</a>`,
    tiktok: `🎵 TikTok<br><a href="https://tiktok.com/@mewingmarket" target="_blank">Vai al profilo TikTok</a>`,
    youtube: `▶️ YouTube<br><a href="https://www.youtube.com/@mewingmarket2" target="_blank">Vai al canale YouTube</a>`,
    x: `📰 X / Twitter<br><a href="https://x.com/mewingm8" target="_blank">Vai al profilo X / Twitter</a>`,
    facebook: `📘 Facebook<br><a href="https://www.facebook.com/profile.php?id=61584779793628" target="_blank">Vai alla pagina Facebook</a>`
  };

  const socialBloc = `
📲 <b>Profili social MewingMarket</b><br><br>
Scegli il social che vuoi visitare:<br>
- Instagram<br>
- TikTok<br>
- YouTube<br>
- Facebook<br>
- X / Twitter<br><br>
Oppure visita il sito:<br>
👉 <a href="https://www.mewingmarket.it" target="_blank">www.mewingmarket.it</a>
`;

  const sitoBloc = `
🌐 <b>Sito ufficiale MewingMarket</b><br><br>
Puoi visitare il sito da qui:<br>
👉 <a href="https://www.mewingmarket.it" target="_blank">www.mewingmarket.it</a><br><br>
Da lì puoi accedere allo store, alla newsletter e alle altre risorse.
`;

  // ========================
  // ROUTING PER INTENT + STATO
  // ========================

  // 1) HERO – livello principale
  if (intent === "hero" || state === "hero") {
    // se l’utente chiede direttamente prezzo o acquisto
    if (text.includes("prezzo") || text.includes("quanto costa")) {
      setState(uid, "hero_acquisto");
      return reply(res, heroPerche);
    }

    if (text.includes("acquista") || text.includes("comprare") || text.includes("voglio acquistare")) {
      setState(uid, "hero_acquisto");
      return reply(res, heroPerche);
    }

    if (intent === "video" || text.includes("video") || text.includes("anteprima") || text.includes("presentazione")) {
      setState(uid, "hero_video");
      return reply(res, heroVideo);
    }

    // default blocco commerciale hero
    setState(uid, "hero");
    return reply(res, heroDescrizione + "<br><br>Se vuoi puoi chiedermi il <b>video</b> o direttamente l’<b>acquisto</b> di HERO.");
  }

  // 2) VIDEO – se arriva da fuori ma riguarda HERO
  if (intent === "video" || state === "hero_video") {
    // dopo che ha visto il video
    if (text.includes("acquista") || text.includes("comprare") || text.includes("voglio acquistare")) {
      setState(uid, "hero_acquisto");
      return reply(res, heroPerche);
    }

    setState(uid, "hero_video");
    return reply(res, heroVideo + "<br><br>" + invitoAcquistoDopoVideo);
  }

  // 3) ACQUISTO HERO diretto
  if (intent === "acquisto" || state === "hero_acquisto") {
    setState(uid, "hero_acquisto");
    return reply(res, heroPerche + "<br><br>" + invitoFinaleHero);
  }

  // 4) SUPPORTO
  if (intent === "supporto" || state.startsWith("supporto")) {
    // sotto-livelli in base al testo
    if (text.includes("non riesco a scaricare") || text.includes("non riesco a scaricare hero") || (text.includes("download") && text.includes("hero"))) {
      setState(uid, "supporto_download");
      return reply(res, supportDownload);
    }

    if (text.includes("download") || text.includes("scaricare")) {
      setState(uid, "supporto_download");
      return reply(res, supportDownload);
    }

    if (text.includes("payhip")) {
      setState(uid, "supporto_payhip");
      return reply(res, supportPayhip);
    }

    if (text.includes("rimborso") || text.includes("rimbors")) {
      setState(uid, "supporto_rimborso");
      return reply(res, supportRimborso);
    }

    if (text.includes("contattare") || text.includes("contatto") || text.includes("assistenza") || text.includes("supporto diretto")) {
      setState(uid, "supporto_contatto");
      return reply(res, supportContatto);
    }

    if (text.includes("newsletter")) {
      setState(uid, "supporto_newsletter");
      return reply(res, supportNewsletterInfo);
    }

    // problemi tecnici generici su sito, social, store
    if (text.includes("sito") || text.includes("pagina") || text.includes("non si apre") || text.includes("errore") || text.includes("bug")) {
      setState(uid, "supporto_tecnico_generico");
      return reply(
        res,
        `
🛠 <b>Problemi tecnici con sito o store</b><br><br>
Prova questi passaggi:<br>
1️⃣ Aggiorna la pagina<br>
2️⃣ Prova da un altro browser (es. Chrome, Firefox, Safari)<br>
3️⃣ Prova da un altro dispositivo o rete<br><br>
Se il problema persiste, inviaci uno screenshot o una breve descrizione dell’errore a:<br>
📧 supporto@mewingmarket.it<br>
📱 WhatsApp: 352 026 6660
`
      );
    }

    // fallback supporto
    setState(uid, "supporto");
    return reply(res, supportGenerico);
  }

  // 5) NEWSLETTER
  if (intent === "newsletter" || state.startsWith("newsletter")) {
    if (text.includes("disiscr") || text.includes("annullare") || text.includes("annulla") || text.includes("cancell")) {
      setState(uid, "newsletter_disiscrizione");
      return reply(res, newsletterDisiscrizione);
    }

    if (text.includes("iscriver") || text.includes("iscrivermi") || text.includes("voglio iscrivermi")) {
      setState(uid, "newsletter_iscrizione");
      return reply(res, newsletterIscrizione);
    }

    setState(uid, "newsletter");
    return reply(res, newsletterIscrizione + "<br><br>Se invece vuoi annullare l’iscrizione, scrivi pure che vuoi disiscriverti.");
  }

  // 6) SOCIAL
  if (intent === "social" || state === "social") {
    // social specifico
    if (text.includes("instagram")) {
      setState(uid, "social_instagram");
      return reply(res, socialLinks.instagram);
    }
    if (text.includes("tiktok")) {
      setState(uid, "social_tiktok");
      return reply(res, socialLinks.tiktok);
    }
    if (text.includes("youtube")) {
      setState(uid, "social_youtube");
      return reply(res, socialLinks.youtube);
    }
    if (text.includes("facebook")) {
      setState(uid, "social_facebook");
      return reply(res, socialLinks.facebook);
    }
    if (text.includes("x") || text.includes("twitter")) {
      setState(uid, "social_x");
      return reply(res, socialLinks.x);
    }

    setState(uid, "social");
    return reply(res, socialBloc);
  }

  // 7) SITO
  if (intent === "sito" || state === "sito") {
    setState(uid, "sito");
    return reply(res, sitoBloc);
  }

  // Se non ha matchato niente qui, passerà alla parte 3 (fallback)
  return handleFallback(req, res, text);
    }
// =========================
// FALLBACK E MENU
// =========================
function handleFallback(req, res, text) {
  const uid = req.uid;
  const state = req.userState.state;

  // Se l’utente chiede aiuto generico
  if (text.includes("aiuto") || text.includes("non so") || text.includes("boh")) {
    setState(uid, "menu");
    return reply(
      res,
      `
Non ho capito perfettamente la richiesta, ma posso aiutarti.<br><br>
Puoi chiedermi ad esempio:<br>
- Informazioni su <b>HERO</b><br>
- Problemi di <b>download</b> o <b>Payhip</b><br>
- Come funziona la <b>newsletter</b><br>
- Link ai nostri <b>social</b> o al <b>sito</b><br><br>
Scrivi pure cosa ti serve e ti porto io al blocco giusto.
`
    );
  }

  // Fallback generico
  return reply(
    res,
    `
🤖 Non ho capito bene la tua richiesta, ma posso aiutarti.<br><br>
Puoi chiedermi su:<br>
- HERO (cosa è, prezzo, perché acquistarlo)<br>
- Supporto (download, Payhip, rimborsi, problemi tecnici)<br>
- Newsletter (iscrizione / disiscrizione)<br>
- Social e sito<br><br>
Scrivi con parole tue cosa ti serve e ti indirizzo io.
`
  );
}

// =========================
// ROUTE DI FALLBACK FRONTEND
// =========================
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

// =========================
// AVVIO SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server attivo sulla porta ${PORT}`);
});
