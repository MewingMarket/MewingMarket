// modules/bot.js — VERSIONE MAX DEFINITIVA

const fetch = require("node-fetch");

const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  findProductFromText,
  listProductsByCategory,
  productReply,
  productLongReply,
  productImageReply
} = require("./catalogo");

const { normalize, cleanSearchQuery } = require("./utils");
const { getProducts } = require("./airtable");
const Context = require("./context");
const Memory = require("./memory");

// ------------------------------
// 🔥 TRACKING BOT
// ------------------------------
function trackBot(event, data = {}) {
  try {
    if (global.trackEvent) {
      global.trackEvent(event, data);
    }
  } catch (e) {
    console.error("Tracking bot error:", e);
  }
}

// ------------------------------
// 🔥 GPT MAX — con memoria + contesto
// ------------------------------
const SYSTEM_PROMPT = `
Sei l'assistente ufficiale di MewingMarket.
Tono: professionale, diretto, utile, commerciale quando serve.
Non inventare prodotti, prezzi, link o contatti.
Usa solo prodotti MewingMarket e logiche di business realistiche.
Se l’utente chiede consigli → consiglia.
Se chiede supporto → risolvi.
Se chiede confronto → confronta.
Se chiede idee → generane.
Se chiede riscrittura → riscrivi.
Se chiede spiegazioni → spiega semplice.
Se esistono risposte predefinite, rispettale e non contraddirle.
`;

async function callGPT(prompt, memory = [], context = {}) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "assistant", content: "Memoria conversazione: " + JSON.stringify(memory || []) },
          { role: "assistant", content: "Contesto pagina: " + JSON.stringify(context || {}) },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "Non riesco a rispondere ora.";
  } catch (err) {
    console.error("GPT error:", err);
    return "Sto avendo un problema temporaneo. Riprova tra poco.";
  }
}

// ------------------------------
// STATO UTENTE GESTITO DAL SERVER
// ------------------------------
function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

function setState(req, newState) {
  if (req.userState && typeof req.userState === "object") {
    req.userState.state = newState;
  }
}

function reply(res, text) {
  trackBot("bot_reply", { text });
  res.json({ reply: text });
}

function isYes(text) {
  const t = (text || "").toLowerCase();
  return (
    t.includes("si") ||
    t.includes("sì") ||
    t.includes("ok") ||
    t.includes("va bene") ||
    t.includes("certo") ||
    t.includes("yes")
  );
}

// ------------------------------------------------------
// DETECT INTENT — VERSIONE MAX
// ------------------------------------------------------
function detectIntent(rawText) {
  const text = rawText || "";
  const t = normalize(text);
  const q = cleanSearchQuery(text);
  const PRODUCTS = getProducts() || [];

  trackBot("intent_detect", { text: rawText });

  // MENU / BENVENUTO
  if (
    q.includes("menu") ||
    q.includes("inizio") ||
    q.includes("start") ||
    q.includes("opzioni") ||
    q.includes("help") ||
    q.includes("informazioni")
  ) {
    return { intent: "menu", sub: null };
  }

  // CATALOGO
  if (
    q.includes("catalogo") ||
    q.includes("prodotti") ||
    q.includes("store")
  ) {
    return { intent: "catalogo", sub: null };
  }

  // SUPPORTO / HELP DESK
  if (
    q.includes("supporto") ||
    q.includes("assistenza") ||
    q.includes("problema") ||
    q.includes("errore") ||
    q.includes("bug") ||
    q.includes("download") ||
    q.includes("payhip") ||
    q.includes("rimborso") ||
    q.includes("resi") ||
    q.includes("rimborsi")
  ) {
    // sotto-intent specifici
    if (q.includes("scaricare") || q.includes("download")) {
      return { intent: "supporto", sub: "download" };
    }
    if (q.includes("payhip")) {
      return { intent: "supporto", sub: "payhip" };
    }
    if (q.includes("rimborso") || q.includes("resi")) {
      return { intent: "supporto", sub: "rimborso" };
    }
    if (q.includes("email") || q.includes("contatto") || q.includes("contattare")) {
      return { intent: "supporto", sub: "contatto" };
    }
    return { intent: "supporto", sub: null };
  }

  // NEWSLETTER
  if (
    q.includes("newsletter") ||
    q.includes("iscrizione") ||
    q.includes("iscrivermi") ||
    q.includes("iscriviti") ||
    q.includes("disiscriv") ||
    q.includes("annulla iscrizione")
  ) {
    if (q.includes("disiscriv") || q.includes("annulla")) {
      return { intent: "newsletter", sub: "unsubscribe" };
    }
    return { intent: "newsletter", sub: "subscribe" };
  }

  // SOCIAL
  if (
    q.includes("social") ||
    q.includes("instagram") ||
    q.includes("tiktok") ||
    q.includes("youtube") ||
    q.includes("facebook") ||
    q.includes("threads") ||
    q.includes("linkedin") ||
    q.includes("x ")
  ) {
    return { intent: "social", sub: null };
  }

  // LEGALI / POLICY
  if (
    q.includes("privacy") ||
    q.includes("dati") ||
    q.includes("gdpr")
  ) {
    return { intent: "privacy", sub: null };
  }

  if (
    q.includes("termini") ||
    q.includes("condizioni") ||
    q.includes("terms")
  ) {
    return { intent: "termini", sub: null };
  }

  if (
    q.includes("cookie")
  ) {
    return { intent: "cookie", sub: null };
  }

  if (
    q.includes("resi") ||
    q.includes("rimborsi") ||
    q.includes("rimborso")
  ) {
    return { intent: "resi", sub: null };
  }

  // FAQ / CONTATTI / DOVE SIAMO
  if (q.includes("faq")) {
    return { intent: "faq", sub: null };
  }

  if (
    q.includes("contatti") ||
    q.includes("contatto") ||
    q.includes("email") ||
    q.includes("whatsapp")
  ) {
    return { intent: "contatti", sub: null };
  }

  if (
    q.includes("dove siamo") ||
    q.includes("indirizzo") ||
    q.includes("sede")
  ) {
    return { intent: "dovesiamo", sub: null };
  }

  // VIDEO
  if (
    q.includes("video") ||
    q.includes("vedere") ||
    q.includes("anteprima") ||
    q.includes("presentazione")
  ) {
    return { intent: "video", sub: null };
  }

  // PREZZO / ACQUISTO
  if (
    q.includes("prezzo") ||
    q.includes("quanto costa") ||
    q.includes("costa") ||
    q.includes("acquistare") ||
    q.includes("comprare") ||
    q.includes("link") ||
    q.includes("dove lo trovo")
  ) {
    return { intent: "prodotto_acquisto", sub: null };
  }

  // MATCH PRODOTTO DA TESTO
  const productFromText = findProductFromText(text);
  if (productFromText) {
    return { intent: "prodotto", sub: productFromText.slug };
  }

  // PAROLE CHIAVE VAGHE → FALLBACK GUIDATO
  if (
    q.includes("non so") ||
    q.includes("boh") ||
    q.includes("aiuto") ||
    q.includes("info") ||
    q.includes("informazioni")
  ) {
    return { intent: "fallback_guidato", sub: null };
  }

  // GPT come fallback intelligente
  if (q.length > 3) {
    return { intent: "gpt", sub: null };
  }

  return { intent: "fallback", sub: null };
}

// ------------------------------------------------------
// HANDLE CONVERSATION — VERSIONE MAX DEFINITIVA
// ------------------------------------------------------
async function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const PRODUCTS = getProducts() || [];

  const state = req.userState || {};
  state.lastIntent = intent;

  Memory.push(uid, rawText || "");
  const pageContext = Context.get(uid);

  trackBot("conversation_step", { uid, intent, sub, text: rawText });

  // ------------------------------------------------------
  // GPT AGENTS (ragionamento libero ma vincolato al brand)
  // ------------------------------------------------------
  if (intent === "gpt") {
    const risposta = await callGPT(rawText, Memory.get(uid), pageContext);
    return reply(res, risposta);
  }

  // ------------------------------------------------------
  // MENU / BENVENUTO
  // ------------------------------------------------------
  if (intent === "menu") {
    setState(req, "menu");
    return reply(res, `
Ciao! 👋  
Sono l'assistente di MewingMarket.

Posso aiutarti con:
• Guida Completa all’Ecosistema Digitale Reale
• altri prodotti del catalogo
• supporto e problemi di download
• newsletter
• social e contatti

Scrivi una parola chiave come "catalogo", "ecosistema", "supporto", "newsletter", "social".
`);
  }

  // ------------------------------------------------------
  // CATALOGO
  // ------------------------------------------------------
  if (intent === "catalogo") {
    setState(req, "catalogo");
    if (!PRODUCTS.length) {
      return reply(res, "Per ora il catalogo è vuoto.");
    }

    let out = "📚 <b>Catalogo MewingMarket</b>\n\n";
    for (const p of PRODUCTS) {
      out += `• <b>${p.titoloBreve || p.titolo}</b> — ${p.prezzo}€\n${p.linkPayhip}\n\n`;
    }
    out += `Puoi scrivere il nome di un prodotto per vedere i dettagli.`;
    return reply(res, out);
  }

  // ------------------------------------------------------
  // BLOCCO PRODOTTO PRINCIPALE (ECOSISTEMA) + ALTRI PRODOTTI
  // ------------------------------------------------------
  if (intent === "prodotto" || intent === "prodotto_acquisto") {
    let product = null;

    if (sub) {
      product = findProductBySlug(sub);
    }

    if (!product) {
      // prova a capire dal testo
      product = findProductFromText(rawText);
    }

    // se ancora nulla e si parla genericamente di "ecosistema" → main product
    if (!product && normalize(rawText).includes("ecosistema")) {
      product = findProductBySlug(MAIN_PRODUCT_SLUG);
    }

    if (!product) {
      return reply(res, `
Non ho capito bene quale prodotto ti interessa.

Puoi:
• scrivere il nome del prodotto
• oppure scrivere "catalogo" per vedere la lista completa.
`);
    }

    // se l'intento è esplicitamente "prodotto_acquisto" → focus su prezzo + link
    if (intent === "prodotto_acquisto") {
      let out = `
📘 <b>${product.titolo}</b>

💰 <b>Prezzo:</b> ${product.prezzo}€
👉 <b>Acquista ora</b>  
${product.linkPayhip}
`;
      out += `

Vuoi vedere anche il video, i dettagli completi o tornare al menu?`;
      setState(req, "prodotto_acquisto");
      state.lastProductSlug = product.slug;
      return reply(res, out);
    }

    // intent "prodotto" → risposta commerciale completa
    setState(req, "prodotto");
    state.lastProductSlug = product.slug;

    const out = productReply(product);
    return reply(res, out);
  }

  // ------------------------------------------------------
  // VIDEO PRODOTTO (ECOSISTEMA O ULTIMO PRODOTTO)
  // ------------------------------------------------------
  if (intent === "video") {
    // usa ultimo prodotto se presente
    let product = null;
    if (state.lastProductSlug) {
      product = findProductBySlug(state.lastProductSlug);
    }

    // se non c'è, prova a capire dal testo
    if (!product) {
      product = findProductFromText(rawText);
    }

    // se ancora nulla e si parla di ecosistema → main product
    if (!product && normalize(rawText).includes("ecosistema")) {
      product = findProductBySlug(MAIN_PRODUCT_SLUG);
    }

    if (!product) {
      return reply(res, `
Non ho capito a quale prodotto ti riferisci per il video.

Puoi scrivere:
• "video ecosistema"
• oppure il nome del prodotto.
`);
    }

    if (!product.youtube_url) {
      return reply(res, `
Questo prodotto non ha un video ufficiale, ma posso mostrarti dettagli, prezzo o immagine.

Vuoi vedere:
• dettagli
• prezzo
• immagine
• oppure tornare al menu?
`);
    }

    let out = `
🎥 <b>Video di presentazione di ${product.titolo}</b>  
${product.youtube_url}

Vuoi acquistarlo o tornare al menu?
`;
    setState(req, "video");
    state.lastProductSlug = product.slug;
    return reply(res, out);
  }

  // ------------------------------------------------------
  // SUPPORTO / HELP DESK
  // ------------------------------------------------------
  if (intent === "supporto") {
    setState(req, "supporto");

    // sotto-livelli specifici
    if (sub === "download") {
      return reply(res, `
Se non riesci a scaricare il prodotto, segui questi passaggi:

1. Controlla la tua email: dopo l’acquisto ricevi un’email con il link di download.
2. Verifica la cartella spam o promozioni.
3. Se non trovi l’email, recupera il link direttamente da Payhip usando lo stesso indirizzo usato per l’acquisto.
4. Se il link non funziona, prova a usare un altro browser o dispositivo.

Se hai ancora problemi, scrivici:
• supporto@mewingmarket.it
• WhatsApp: 352 026 6660

Vuoi tornare al menu o hai bisogno di altro?
`);
    }

    if (sub === "payhip") {
      return reply(res, `
Payhip è la piattaforma che gestisce pagamenti e download dei prodotti digitali.

Come funziona:
- Dopo il pagamento ricevi immediatamente un’email con il link per scaricare il prodotto.
- Il link è sicuro e personale.
- Puoi accedere ai tuoi acquisti anche dalla tua area Payhip usando lo stesso indirizzo email usato per l’acquisto.
- Il download è immediato e non richiede installazioni.

Se hai problemi con Payhip, scrivici:
• supporto@mewingmarket.it
• WhatsApp: 352 026 6660

Vuoi tornare al menu o hai bisogno di altro?
`);
    }

    if (sub === "rimborso") {
      return reply(res, `
I prodotti digitali non prevedono reso automatico, ma valutiamo ogni richiesta caso per caso.

✅ Puoi richiedere un rimborso se:
• il file non è scaricabile
• c’è un errore tecnico imputabile a noi
• hai fatto un acquisto duplicato

❌ Non è previsto rimborso se:
• il prodotto è già stato scaricato
• c’è stato un uso improprio
• la richiesta non è motivata

Per assistenza:
• supporto@mewingmarket.it
• WhatsApp: 352 026 6660

Puoi anche consultare la pagina "Resi e Rimborsi":  
resi.html

Vuoi tornare al menu o hai bisogno di altro?
`);
    }

    if (sub === "contatto") {
      return reply(res, `
Puoi contattare il supporto direttamente:

• Email supporto: supporto@mewingmarket.it
• Email alternative: MewingMarket@outlook.it, mewingmarket2@gmail.com
• WhatsApp Business: 352 026 6660

Siamo disponibili per:
- problemi di download
- informazioni sui prodotti
- assistenza sugli acquisti
- domande tecniche

Vuoi tornare al menu o hai bisogno di altro?
`);
    }

    // supporto generico → mostra help desk
    return reply(res, `
Sono qui per aiutarti 💬  
Scegli il tipo di supporto:

• Download / non riesco a scaricare
• Payhip e pagamenti
• Resi e rimborsi
• Contattare il supporto

Scrivi una parola chiave come:
"download", "payhip", "rimborso", "contatto".
`);
  }

  // ------------------------------------------------------
  // NEWSLETTER
  // ------------------------------------------------------
  if (intent === "newsletter") {
    setState(req, "newsletter");

    if (sub === "unsubscribe") {
      return reply(res, `
Vuoi annullare l'iscrizione alla newsletter?

Puoi farlo da qui:
disiscriviti.html

Se hai problemi, scrivici:
supporto@mewingmarket.it

Hai bisogno di altro o vuoi tornare al menu?
`);
    }

    // subscribe
    return reply(res, `
Vuoi iscriverti alla newsletter di MewingMarket?

Riceverai:
• contenuti utili
• aggiornamenti sui prodotti
• novità e risorse pratiche

Puoi iscriverti da qui:
iscrizione.html

Hai bisogno di altro o vuoi tornare al menu?
`);
  }

  // ------------------------------------------------------
  // SOCIAL
  // ------------------------------------------------------
  if (intent === "social") {
    setState(req, "social");
    return reply(res, `
Ecco i nostri social ufficiali 📲

• Instagram: https://www.instagram.com/mewingmarket
• TikTok: https://www.tiktok.com/@mewingmarket
• YouTube: https://www.youtube.com/@mewingmarket2
• Facebook: https://www.facebook.com/profile.php?id=61584779793628
• X: https://x.com/mewingm8
• Threads: https://www.threads.net/@mewingmarket
• LinkedIn: https://www.linkedin.com/company/mewingmarket

Vuoi tornare al menu o vedere il catalogo?
`);
  }

  // ------------------------------------------------------
  // LEGALI / POLICY
  // ------------------------------------------------------
  if (intent === "privacy") {
    return reply(res, `
La Privacy Policy di MewingMarket spiega come gestiamo i tuoi dati.

In sintesi:
• raccogliamo nome e email per la newsletter
• i dati di pagamento sono gestiti da Payhip (non li vediamo noi)
• usiamo dati tecnici anonimi (cookie, analytics)
• puoi chiedere accesso, modifica o cancellazione dei tuoi dati

Puoi leggere la Privacy Policy completa qui:
privacy.html

Hai bisogno di altro o vuoi tornare al menu?
`);
  }

  if (intent === "termini") {
    return reply(res, `
I Termini e Condizioni spiegano come funziona MewingMarket.

In sintesi:
• vendiamo prodotti digitali tramite Payhip
• l'uso è personale salvo diversa indicazione
• il download è immediato dopo il pagamento
• i rimborsi sono valutati caso per caso
• i contenuti sono protetti da copyright

Puoi leggere la pagina completa qui:
termini-e-condizioni.html

Hai bisogno di altro o vuoi tornare al menu?
`);
  }

  if (intent === "cookie") {
    return reply(res, `
Usiamo cookie tecnici e analytics per migliorare il sito.

Puoi leggere la Cookie Policy completa qui:
cookie.html

Hai bisogno di altro o vuoi tornare al menu?
`);
  }

  if (intent === "resi") {
    return reply(res, `
I prodotti digitali non prevedono reso automatico, ma valutiamo ogni richiesta caso per caso.

Puoi leggere la pagina "Resi e Rimborsi" qui:
resi.html

Se hai un problema specifico, scrivici:
supporto@mewingmarket.it
WhatsApp: 352 026 6660

Hai bisogno di altro o vuoi tornare al menu?
`);
  }

  // ------------------------------------------------------
  // FAQ / CONTATTI / DOVE SIAMO
  // ------------------------------------------------------
  if (intent === "faq") {
    return reply(res, `
Puoi consultare le FAQ qui:
FAQ.html

Domande frequenti:
• Come funziona l’acquisto?
• Posso chiedere un rimborso?
• Come ricevo il prodotto?
• Posso usare i prodotti commercialmente?
• Non riesco a scaricare il file.

Se non trovi la risposta, scrivici:
supporto@mewingmarket.it

Vuoi tornare al menu o hai bisogno di altro?
`);
  }

  if (intent === "contatti") {
    return reply(res, `
Ecco i contatti ufficiali MewingMarket:

• Vendite: vendite@mewingmarket.it
• Supporto: supporto@mewingmarket.it
• Email alternative: MewingMarket@outlook.it, mewingmarket2@gmail.com
• WhatsApp Business: 352 026 6660

Puoi anche usare la pagina contatti:
contatti.html

Vuoi tornare al menu o vedere il catalogo?
`);
  }

  if (intent === "dovesiamo") {
    return reply(res, `
La sede di MewingMarket è:

Strada Ciousse 35  
18038 Sanremo (IM) — Italia

Puoi vedere la pagina "Dove siamo" qui:
dovesiamo.html

Vuoi tornare al menu o hai bisogno di altro?
`);
  }

  // ------------------------------------------------------
  // FALLBACK GUIDATO
  // ------------------------------------------------------
  if (intent === "fallback_guidato") {
    return reply(res, `
Non ho capito bene la tua richiesta, ma posso aiutarti!

Vuoi:
• informazioni su un prodotto
• supporto
• newsletter
• social
• tornare al menu

Scrivi una di queste parole chiave.
`);
  }

  // ------------------------------------------------------
  // FALLBACK FINALE
  // ------------------------------------------------------
  return reply(res, `
Posso aiutarti con:
• prodotti e catalogo
• supporto e problemi di download
• newsletter
• social
• informazioni legali

Scrivi una parola chiave come:
"catalogo", "supporto", "newsletter", "social", "privacy", "resi" o "menu".
`);
}

// ------------------------------------------------------
// EXPORT FINALE — BOT MAX COMPLETO
// ------------------------------------------------------
module.exports = {
  detectIntent,
  handleConversation,
  reply,
  generateUID,
  setState,
  isYes
};
