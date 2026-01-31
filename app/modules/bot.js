// modules/bot.js — VERSIONE COMMERCIALE V3

const fetch = require("node-fetch");

const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  productReply,
  productLongReply,
  productImageReply
} = require("./catalogo");

const { normalize, cleanSearchQuery } = require("./utils");
const { getProducts } = require("./airtable");
const Context = require("./context");
const Memory = require("./memory");

// ------------------------------
// TRACKING
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
// GPT CORE
// ------------------------------
const SYSTEM_PROMPT = `
Sei l'assistente ufficiale di MewingMarket.

Tono:
- chiaro
- diretto
- professionale
- commerciale quando serve
- mai aggressivo, ma deciso

Regole:
- Non inventare prodotti, prezzi, link o contatti.
- Usa solo prodotti MewingMarket.
- Se l'utente chiede consigli: consiglia il prodotto migliore in base al suo obiettivo.
- Se l'utente ha dubbi: chiarisci, rassicura, spiega il valore.
- Se l'utente tratta: mantieni il valore, non inventare sconti, ma spiega perché il prezzo è giustificato.
- Se l'utente è pronto: porta alla chiusura con link Payhip (se fornito nel contesto).
- Se l'utente chiede cose generiche (anche fuori tema): rispondi comunque in modo coerente, ma senza uscire dal ruolo di assistente MewingMarket.
`;

async function callGPT(prompt, memory = [], context = {}, extraSystem = "") {
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
          { role: "system", content: SYSTEM_PROMPT + (extraSystem || "") },
          { role: "assistant", content: "Memoria conversazione: " + JSON.stringify(memory || []) },
          { role: "assistant", content: "Contesto pagina: " + JSON.stringify(context || {}) },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "In questo momento non riesco a formulare una risposta utile.";
  } catch (err) {
    console.error("GPT error:", err);
    return "Sto avendo un problema temporaneo. Riprova tra poco.";
  }
}

// ------------------------------
// UTILS STATO
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

// ------------------------------
// MATCH PRODOTTI — FUZZY + SINONIMI
// ------------------------------
function buildProductIndex() {
  const products = getProducts() || [];
  return products.map(p => {
    const titolo = (p.titolo || "").toLowerCase();
    const slug = (p.slug || "").toLowerCase();

    const synonyms = [];

    // sinonimi generici basati sul titolo
    if (titolo.includes("ecosistema")) {
      synonyms.push("ecosistema", "ecosistema digitale", "guida ecosistema", "ecosist");
    }
    if (titolo.includes("business") && titolo.includes("ai")) {
      synonyms.push("business ai", "business digitale ai", "business 90 giorni", "business digitale");
    }
    if (titolo.includes("contenuti")) {
      synonyms.push("contenuti", "guida contenuti", "creare contenuti", "content");
    }
    if (titolo.includes("competenze")) {
      synonyms.push("competenze", "analisi competenze", "skill", "analisi delle competenze");
    }
    if (titolo.includes("produttività") || titolo.includes("planner")) {
      synonyms.push("produttività", "planner ai", "planner produttività", "produttivita");
    }
    if (titolo.includes("business plan")) {
      synonyms.push("business plan", "workbook business plan", "plan", "piano business");
    }
    if (titolo.includes("fiscale") || titolo.includes("forfettario") || titolo.includes("flessinance")) {
      synonyms.push("forfettario", "guida fiscale", "fisco", "flessinance");
    }

    return {
      ...p,
      _index: {
        titolo,
        slug,
        synonyms
      }
    };
  });
}

function textIncludesAny(text, arr) {
  const t = text.toLowerCase();
  return arr.some(k => t.includes(k.toLowerCase()));
}

function fuzzyMatchProduct(text) {
  const products = buildProductIndex();
  const t = (text || "").toLowerCase();

  // 1) match diretto su titolo o slug
  let best = null;
  for (const p of products) {
    if (!p._index) continue;
    if (t.includes(p._index.slug) || t.includes(p._index.titolo)) {
      best = p;
      break;
    }
  }
  if (best) return best;

  // 2) match su sinonimi
  for (const p of products) {
    if (!p._index) continue;
    if (textIncludesAny(t, p._index.synonyms)) {
      return p;
    }
  }

  // 3) match parziale molto lasco (parole chiave)
  const keywords = t.split(/\s+/).filter(w => w.length > 3);
  if (keywords.length) {
    for (const p of products) {
      const titolo = p._index?.titolo || "";
      if (keywords.some(k => titolo.includes(k))) {
        return p;
      }
    }
  }

  return null;
}

// ------------------------------
// DETECT INTENT V3
// ------------------------------
function detectIntent(rawText) {
  const text = rawText || "";
  const t = normalize(text);
  const q = cleanSearchQuery(text);

  trackBot("intent_detect", { text: rawText });

  // MENU / BENVENUTO
  if (
    q.includes("menu") ||
    q.includes("inizio") ||
    q.includes("start") ||
    q.includes("opzioni") ||
    q.includes("help")
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
  if (q.includes("privacy") || q.includes("dati") || q.includes("gdpr")) {
    return { intent: "privacy", sub: null };
  }

  if (q.includes("termini") || q.includes("condizioni") || q.includes("terms")) {
    return { intent: "termini", sub: null };
  }

  if (q.includes("cookie")) {
    return { intent: "cookie", sub: null };
  }

  if (q.includes("resi") || q.includes("rimborsi") || q.includes("rimborso")) {
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

  // INTENT COMMERCIALI
  if (
    q.includes("acquista") ||
    q.includes("compra") ||
    q.includes("prendo") ||
    q.includes("lo prendo") ||
    q.includes("lo compro")
  ) {
    return { intent: "acquisto_diretto", sub: null };
  }

  if (
    q.includes("dettagli") ||
    q.includes("approfondisci") ||
    q.includes("info") ||
    q.includes("informazioni") ||
    q.includes("spiegami meglio")
  ) {
    return { intent: "dettagli_prodotto", sub: null };
  }

  if (
    q.includes("video") ||
    q.includes("anteprima") ||
    q.includes("presentazione")
  ) {
    return { intent: "video_prodotto", sub: null };
  }

  if (
    q.includes("prezzo") ||
    q.includes("quanto costa") ||
    q.includes("costa") ||
    q.includes("costo")
  ) {
    return { intent: "prezzo_prodotto", sub: null };
  }

  if (
    q.includes("sconto") ||
    q.includes("sconti") ||
    q.includes("offerta") ||
    q.includes("promo")
  ) {
    return { intent: "trattativa", sub: "sconto" };
  }

  if (
    q.includes("è caro") ||
    q.includes("troppo caro") ||
    q.includes("non so se vale") ||
    q.includes("non so se mi serve")
  ) {
    return { intent: "obiezione", sub: "prezzo" };
  }

  // MATCH PRODOTTO FUZZY
  const product = fuzzyMatchProduct(text);
  if (product) {
    return { intent: "prodotto", sub: product.slug };
  }

  // FALLBACK GPT COMMERCIALE / GENERALE
  return { intent: "gpt", sub: null };
}

// ------------------------------
// HANDLE CONVERSATION
// ------------------------------
async function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const state = req.userState || {};
  const PRODUCTS = getProducts() || [];

  state.lastIntent = intent;
  Memory.push(uid, rawText || "");
  const pageContext = Context.get(uid);

  trackBot("conversation_step", { uid, intent, sub, text: rawText });

  // GPT FALLBACK / GENERALE
  if (intent === "gpt") {
    const risposta = await callGPT(rawText, Memory.get(uid), pageContext);
    return reply(res, risposta);
  }
// CONVERSAZIONE GENERALE
if (intent === "conversazione") {
  const risposta = await callGPT(
    rawText,
    Memory.get(uid),
    pageContext,
    "\nRispondi in modo amichevole, breve, coerente con il brand MewingMarket, e se possibile collega la conversazione ai prodotti o al valore del digitale."
  );
  return reply(res, risposta);
}
  // MENU
  if (intent === "menu") {
    setState(req, "menu");
    return reply(res, `
Ciao 👋  
Sono l'assistente di MewingMarket.

Posso aiutarti a:
• scegliere il prodotto giusto
• capire cosa fa ogni guida
• risolvere problemi di download o pagamenti
• gestire newsletter, contatti, social
• chiarire dubbi su resi, privacy, termini

Scrivi una parola chiave come:
"catalogo", "ecosistema", "business", "contenuti", "produttività", "supporto", "newsletter".
`);
  }

  // CATALOGO
  if (intent === "catalogo") {
    setState(req, "catalogo");
    if (!PRODUCTS.length) {
      return reply(res, "Il catalogo sarà presto disponibile. Stiamo preparando i primi prodotti.");
    }

    let out = "📚 <b>Catalogo MewingMarket</b>\n\n";
    for (const p of PRODUCTS) {
      out += `• <b>${p.titoloBreve || p.titolo}</b> — ${p.prezzo}€\n${p.linkPayhip}\n\n`;
    }
    out += `Puoi scrivere il nome di un prodotto o il tuo obiettivo, e ti consiglio cosa scegliere.`;
    return reply(res, out);
  }
// CONVERSAZIONE GENERALE
if (
  q.includes("come va") ||
  q.includes("come stai") ||
  q.includes("tutto bene") ||
  q.includes("e te") ||
  q.includes("che fai") ||
  q.includes("parlami") ||
  q.includes("dimmi qualcosa")
) {
  return { intent: "conversazione", sub: null };
}

// ISCRIZIONE GENERICA
if (
  q.includes("iscrizione") ||
  q.includes("mi iscrivo") ||
  q.includes("voglio iscrivermi")
) {
  return { intent: "newsletter", sub: "subscribe" };
}

// ACQUISTO GENERICO
if (
  q.includes("acquisto") ||
  q.includes("fare un acquisto") ||
  q.includes("voglio acquistare") ||
  q.includes("procedo all acquisto")
) {
  return { intent: "acquisto_diretto", sub: null };
}
  // NEWSLETTER
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

  // SOCIAL
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

  // LEGALI
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

  // FAQ / CONTATTI / DOVE SIAMO
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

  // SUPPORTO
  if (intent === "supporto") {
    setState(req, "supporto");

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

  // MATCH PRODOTTO (COMMERCIALE)
  const lastProductSlug = state.lastProductSlug;
  let matchedProduct = null;

  if (intent === "prodotto" && sub) {
    matchedProduct = findProductBySlug(sub) || fuzzyMatchProduct(rawText);
  }

  // ACQUISTO DIRETTO
  if (intent === "acquisto_diretto") {
    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) {
      product = findProductBySlug(lastProductSlug);
    }
    if (!product) {
      return reply(res, `
Non ho capito bene quale prodotto vuoi acquistare.

Puoi scrivere:
• il nome del prodotto (es. "Ecosistema Digitale", "Business Digitale AI")
• oppure "catalogo" per vedere la lista completa.
`);
    }

    state.lastProductSlug = product.slug;
    setState(req, "acquisto_diretto");

    return reply(res, `
Perfetto, ottima scelta.

📘 <b>${product.titolo}</b>  
💰 <b>Prezzo:</b> ${product.prezzo}€  

Puoi acquistarlo direttamente da qui:
${product.linkPayhip}

Dopo il pagamento ricevi subito il file digitale.  
Se vuoi, posso anche dirti come iniziare nei primi 5 minuti.
`);
  }

  // DETTAGLI PRODOTTO
  if (intent === "dettagli_prodotto") {
    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) {
      product = findProductBySlug(lastProductSlug);
    }
    if (!product) {
      return reply(res, `
Dimmi il nome del prodotto di cui vuoi i dettagli  
(es. "Ecosistema Digitale", "Business Digitale AI", "Planner Produttività AI").
`);
    }

    state.lastProductSlug = product.slug;
    setState(req, "dettagli_prodotto");

    const out = productLongReply(product);
    return reply(res, out + `

Se vuoi, posso:
• spiegarti se è adatto alla tua situazione
• confrontarlo con altri prodotti
• portarti direttamente all’acquisto
`);
  }

  // VIDEO PRODOTTO
  if (intent === "video_prodotto") {
    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) {
      product = findProductBySlug(lastProductSlug);
    }
    if (!product) {
      return reply(res, `
Non ho capito a quale prodotto ti riferisci per il video.

Puoi scrivere:
• "video ecosistema"
• "video business ai"
• oppure il nome del prodotto.
`);
    }

    if (!product.youtube_url) {
      return reply(res, `
Questo prodotto non ha un video ufficiale, ma posso spiegarti in modo chiaro cosa contiene e come usarlo.

Vuoi una spiegazione veloce o dettagli completa?
`);
    }

    state.lastProductSlug = product.slug;
    setState(req, "video_prodotto");

    return reply(res, `
🎥 <b>Video di presentazione di ${product.titolo}</b>  
${product.youtube_url}

Vuoi che ti riassuma i punti chiave o che ti porti direttamente all’acquisto?
`);
  }

  // PREZZO PRODOTTO
  if (intent === "prezzo_prodotto") {
    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) {
      product = findProductBySlug(lastProductSlug);
    }
    if (!product) {
      return reply(res, `
Dimmi il nome del prodotto di cui vuoi sapere il prezzo  
(es. "Ecosistema Digitale", "Business Digitale AI", "Planner Produttività AI").
`);
    }

    state.lastProductSlug = product.slug;
    setState(req, "prezzo_prodotto");

    return reply(res, `
📘 <b>${product.titolo}</b>  
💰 <b>Prezzo:</b> ${product.prezzo}€

Se vuoi, posso:
• spiegarti cosa ottieni esattamente
• confrontarlo con altri prodotti
• portarti direttamente all’acquisto
`);
  }

  // OBIETTIVO / TRATTATIVA / OBIETTA PREZZO
  if (intent === "trattativa" && sub === "sconto") {
    return reply(res, `
Capisco la domanda sullo sconto.

MewingMarket non lavora a sconti continui, perché ogni prodotto è pensato per farti risparmiare:
• tempo
• errori
• complessità

Piuttosto che abbassare il prezzo, preferiamo aumentare il valore.

Se vuoi, ti spiego in modo diretto:
• cosa risolve il prodotto che stai valutando
• perché può valere l’investimento per te
`);
  }

  if (intent === "obiezione" && sub === "prezzo") {
    return reply(res, `
Capisco il dubbio sul prezzo, è una domanda intelligente.

Il punto non è pagare per un file, ma per:
• una struttura già pronta
• un metodo che ti evita errori
• una guida che ti fa risparmiare tempo e fatica

Se mi dici in che situazione sei (es. "sto iniziando", "sono già avviato", "sono bloccato"), posso dirti in modo onesto se il prodotto ha senso per te oppure no.
`);
  }

  // INTENT PRODOTTO GENERICO
  if (intent === "prodotto") {
    let product = null;
    if (sub) {
      product = findProductBySlug(sub);
    }
    if (!product) {
      product = fuzzyMatchProduct(rawText);
    }
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

    state.lastProductSlug = product.slug;
    setState(req, "prodotto");

    const out = productReply(product);
    return reply(res, out + `

Se vuoi, posso:
• dirti se è adatto alla tua situazione
• confrontarlo con altri prodotti
• portarti direttamente all’acquisto
`);
  }

  // FALLBACK INTELLIGENTE
  const risposta = await callGPT(rawText, Memory.get(uid), pageContext);
  return reply(res, risposta);
}

// ------------------------------
// EXPORT
// ------------------------------
module.exports = {
  detectIntent,
  handleConversation,
  reply,
  generateUID,
  setState,
  isYes
};
