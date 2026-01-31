// modules/bot.js — COPILOT VERSIONE MASSIMA (GPT-FIRST)

const fetch = require("node-fetch");

const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  productReply,
  productLongReply
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
const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket, integrato nel sito.

Tono:
- chiaro
- diretto
- professionale
- amichevole
- commerciale quando serve
- mai aggressivo, ma deciso

Regole generali:
- Non inventare prodotti, prezzi, link o contatti.
- Usa solo prodotti MewingMarket se sono nel contesto.
- Se l'utente chiede consigli: consiglia il prodotto migliore in base al suo obiettivo.
- Se l'utente ha dubbi: chiarisci, rassicura, spiega il valore.
- Se l'utente tratta: mantieni il valore, non inventare sconti, ma spiega perché il prezzo è giustificato.
- Se l'utente è pronto: porta alla chiusura con link Payhip (se fornito nel contesto).
- Se l'utente chiede cose generiche (anche fuori tema): rispondi comunque in modo coerente, ma senza uscire dal ruolo di assistente MewingMarket.

Social:
- Se l'utente chiede di un social specifico, spiega cosa trova lì:
  - Instagram: contenuti visivi, aggiornamenti veloci, dietro le quinte.
  - TikTok: clip brevi, spiegazioni rapide, pillole pratiche.
  - YouTube: contenuti più lunghi, spiegazioni approfondite, walkthrough.
  - Facebook: aggiornamenti, post informativi, link alle risorse.
  - X: pensieri brevi, aggiornamenti rapidi, note veloci.
  - Threads: conversazioni più discorsive, riflessioni.
  - LinkedIn: contenuti più professionali, business, posizionamento.

Contatto umano:
- Se l'utente chiede aiuto su qualcosa di molto personale, privato, o che richiede accesso a dati sensibili (es. problemi fiscali specifici, dati personali, casi particolari di pagamento, situazioni delicate):
  - Suggerisci SEMPRE come opzione finale:
    - Email supporto: supporto@mewingmarket.it
    - Email vendite: vendite@mewingmarket.it
    - WhatsApp Business: 352 026 6660
  - Spiega che per casi specifici è meglio un contatto diretto.

Stile:
- Risposte brevi ma dense, niente muri di testo inutili.
- Usa elenchi solo quando servono davvero.
- Mantieni sempre il ruolo di Copilot MewingMarket.
`;

async function callGPT(userPrompt, memory = [], context = {}, extraSystem = "", extraData = {}) {
  try {
    const system = BASE_SYSTEM_PROMPT + (extraSystem || "");
    const payload = {
      model: "meta-llama/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: system },
        {
          role: "assistant",
          content: "Memoria conversazione (estratto): " + JSON.stringify(memory || [])
        },
        {
          role: "assistant",
          content: "Contesto pagina: " + JSON.stringify(context || {})
        },
        {
          role: "assistant",
          content: "Dati strutturati disponibili: " + JSON.stringify(extraData || {})
        },
        { role: "user", content: userPrompt }
      ]
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
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
}// ------------------------------
// MATCH PRODOTTI — FUZZY + SINONIMI + PAROLE CHIAVE
// ------------------------------

function buildProductIndex() {
  const products = getProducts() || [];

  return products.map(p => {
    const titolo = (p.titolo || "").toLowerCase();
    const slug = (p.slug || "").toLowerCase();

    // Sinonimi dinamici basati sul titolo
    const synonyms = [];

    // Ecosistema Digitale
    if (titolo.includes("ecosistema")) {
      synonyms.push(
        "ecosistema",
        "ecosistema digitale",
        "eco sistema",
        "ecosist",
        "ecos",
        "guida ecosistema",
        "ecosistema reale"
      );
    }

    // Business Digitale AI
    if (titolo.includes("business") && titolo.includes("ai")) {
      synonyms.push(
        "business ai",
        "business digitale ai",
        "business digitale",
        "business 90 giorni",
        "ai business",
        "business plan ai"
      );
    }

    // Contenuti
    if (titolo.includes("contenuti")) {
      synonyms.push(
        "contenuti",
        "content",
        "creare contenuti",
        "guida contenuti",
        "contenuto",
        "content creation"
      );
    }

    // Competenze
    if (titolo.includes("competenze")) {
      synonyms.push(
        "competenze",
        "analisi competenze",
        "skill",
        "analisi delle competenze",
        "valutazione competenze"
      );
    }

    // Produttività / Planner
    if (titolo.includes("produttività") || titolo.includes("planner")) {
      synonyms.push(
        "produttività",
        "produttivita",
        "planner ai",
        "planner produttività",
        "planner",
        "produttività ai"
      );
    }

    // Business Plan
    if (titolo.includes("business plan")) {
      synonyms.push(
        "business plan",
        "workbook business plan",
        "plan",
        "piano business",
        "piano aziendale"
      );
    }

    // Fisco / Forfettario / Flessinance
    if (
      titolo.includes("fiscale") ||
      titolo.includes("forfettario") ||
      titolo.includes("flessinance")
    ) {
      synonyms.push(
        "forfettario",
        "guida fiscale",
        "fisco",
        "flessinance",
        "tasse",
        "guida forfettario"
      );
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

  // 1) Match diretto su slug o titolo
  for (const p of products) {
    if (!p._index) continue;
    if (t.includes(p._index.slug) || t.includes(p._index.titolo)) {
      return p;
    }
  }

  // 2) Match su sinonimi
  for (const p of products) {
    if (!p._index) continue;
    if (textIncludesAny(t, p._index.synonyms)) {
      return p;
    }
  }

  // 3) Match su parole chiave (fallback molto lasco)
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
        }// ------------------------------
// DETECT INTENT V5 — GPT-FIRST, COMMERCIALE, CONVERSAZIONALE
// ------------------------------

function detectIntent(rawText) {
  const text = rawText || "";
  const t = normalize(text);
  const q = cleanSearchQuery(text);

  trackBot("intent_detect", { text: rawText });

  // ------------------------------
  // CONVERSAZIONE GENERALE
  // ------------------------------
  if (
    q.includes("come va") ||
    q.includes("come stai") ||
    q.includes("tutto bene") ||
    q.includes("e te") ||
    q.includes("che fai") ||
    q.includes("parlami") ||
    q.includes("dimmi qualcosa") ||
    q.includes("sei vivo") ||
    q.includes("sei reale") ||
    q.includes("ciao") ||
    q.includes("hey") ||
    q.includes("buongiorno") ||
    q.includes("buonasera")
  ) {
    return { intent: "conversazione", sub: null };
  }

  // ------------------------------
  // MENU / BENVENUTO
  // ------------------------------
  if (
    q.includes("menu") ||
    q.includes("inizio") ||
    q.includes("start") ||
    q.includes("opzioni") ||
    q.includes("help") ||
    q.includes("aiuto")
  ) {
    return { intent: "menu", sub: null };
  }

  // ------------------------------
  // CATALOGO
  // ------------------------------
  if (
    q.includes("catalogo") ||
    q.includes("prodotti") ||
    q.includes("store") ||
    q.includes("shop")
  ) {
    return { intent: "catalogo", sub: null };
  }

  // ------------------------------
  // ISCRIZIONE GENERICA
  // ------------------------------
  if (
    q.includes("iscrizione") ||
    q.includes("mi iscrivo") ||
    q.includes("voglio iscrivermi") ||
    q.includes("registrazione")
  ) {
    return { intent: "newsletter", sub: "subscribe" };
  }

  // ------------------------------
  // NEWSLETTER
  // ------------------------------
  if (
    q.includes("newsletter") ||
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

  // ------------------------------
  // SOCIAL — DISTINGUI UNO PER UNO
  // ------------------------------
  if (q.includes("instagram")) return { intent: "social_specifico", sub: "instagram" };
  if (q.includes("tiktok")) return { intent: "social_specifico", sub: "tiktok" };
  if (q.includes("youtube")) return { intent: "social_specifico", sub: "youtube" };
  if (q.includes("facebook")) return { intent: "social_specifico", sub: "facebook" };
  if (q.includes("threads")) return { intent: "social_specifico", sub: "threads" };
  if (q.includes("linkedin")) return { intent: "social_specifico", sub: "linkedin" };
  if (q.includes("x ") || q === "x") return { intent: "social_specifico", sub: "x" };

  // Social generico
  if (q.includes("social")) {
    return { intent: "social", sub: null };
  }

  // ------------------------------
  // LEGALI / POLICY
  // ------------------------------
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

  // ------------------------------
  // FAQ / CONTATTI / DOVE SIAMO
  // ------------------------------
  if (q.includes("faq")) {
    return { intent: "faq", sub: null };
  }

  if (
    q.includes("contatti") ||
    q.includes("contatto") ||
    q.includes("email") ||
    q.includes("whatsapp") ||
    q.includes("numero") ||
    q.includes("telefono")
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

  // ------------------------------
  // SUPPORTO / HELP DESK
  // ------------------------------
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

  // ------------------------------
  // ACQUISTO GENERICO
  // ------------------------------
  if (
    q.includes("acquisto") ||
    q.includes("fare un acquisto") ||
    q.includes("voglio acquistare") ||
    q.includes("procedo all acquisto") ||
    q.includes("procedo all'acquisto")
  ) {
    return { intent: "acquisto_diretto", sub: null };
  }

  // ------------------------------
  // ACQUISTO DIRETTO
  // ------------------------------
  if (
    q.includes("acquista") ||
    q.includes("compra") ||
    q.includes("prendo") ||
    q.includes("lo prendo") ||
    q.includes("lo compro")
  ) {
    return { intent: "acquisto_diretto", sub: null };
  }

  // ------------------------------
  // DETTAGLI PRODOTTO
  // ------------------------------
  if (
    q.includes("dettagli") ||
    q.includes("approfondisci") ||
    q.includes("info") ||
    q.includes("informazioni") ||
    q.includes("spiegami meglio")
  ) {
    return { intent: "dettagli_prodotto", sub: null };
  }

  // ------------------------------
  // VIDEO PRODOTTO
  // ------------------------------
  if (
    q.includes("video") ||
    q.includes("anteprima") ||
    q.includes("presentazione")
  ) {
    return { intent: "video_prodotto", sub: null };
  }

  // ------------------------------
  // PREZZO PRODOTTO
  // ------------------------------
  if (
    q.includes("prezzo") ||
    q.includes("quanto costa") ||
    q.includes("costa") ||
    q.includes("costo")
  ) {
    return { intent: "prezzo_prodotto", sub: null };
  }

  // ------------------------------
  // TRATTATIVA
  // ------------------------------
  if (
    q.includes("sconto") ||
    q.includes("sconti") ||
    q.includes("offerta") ||
    q.includes("promo")
  ) {
    return { intent: "trattativa", sub: "sconto" };
  }

  // ------------------------------
  // OBIETTA PREZZO
  // ------------------------------
  if (
    q.includes("è caro") ||
    q.includes("troppo caro") ||
    q.includes("non so se vale") ||
    q.includes("non so se mi serve") ||
    q.includes("caro")
  ) {
    return { intent: "obiezione", sub: "prezzo" };
  }

  // ------------------------------
  // MATCH PRODOTTO FUZZY
  // ------------------------------
  const product = fuzzyMatchProduct(text);
  if (product) {
    return { intent: "prodotto", sub: product.slug };
  }

  // ------------------------------
  // FALLBACK GPT
  // ------------------------------
  return { intent: "gpt", sub: null };
               }// ------------------------------
// HANDLE CONVERSATION — GPT-FIRST, COMMERCIALE, COMPLETO
// ------------------------------

async function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const state = req.userState || {};
  const PRODUCTS = getProducts() || [];

  state.lastIntent = intent;
  Memory.push(uid, rawText || "");
  const pageContext = Context.get(uid);

  trackBot("conversation_step", { uid, intent, sub, text: rawText });

  // ------------------------------
  // GPT FALLBACK / GENERALE
  // ------------------------------
  if (intent === "gpt") {
    const risposta = await callGPT(rawText, Memory.get(uid), pageContext);
    return reply(res, risposta);
  }

  // ------------------------------
  // CONVERSAZIONE GENERALE
  // ------------------------------
  if (intent === "conversazione") {
    const risposta = await callGPT(
      rawText,
      Memory.get(uid),
      pageContext,
      "\nRispondi in modo amichevole, breve, coerente con il brand MewingMarket, e collega la conversazione ai prodotti o al valore del digitale quando ha senso."
    );
    return reply(res, risposta);
  }

  // ------------------------------
  // MENU
  // ------------------------------
  if (intent === "menu") {
    setState(req, "menu");

    const base = `
Ciao 👋  
Sono il Copilot di MewingMarket.

Posso aiutarti a:
• scegliere il prodotto giusto  
• capire cosa fa ogni guida  
• risolvere problemi di download o pagamenti  
• gestire newsletter, contatti, social  
• chiarire dubbi su resi, privacy, termini  

Scrivi una parola chiave come:
"catalogo", "ecosistema", "business", "contenuti", "produttività", "supporto", "newsletter".
`;

    const enriched = await callGPT(
      rawText || "Mostra menu iniziale",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più umano e accogliente, senza cambiare la struttura."
    );

    return reply(res, enriched || base);
      }// ------------------------------
  // CATALOGO
  // ------------------------------
  if (intent === "catalogo") {
    setState(req, "catalogo");

    if (!PRODUCTS.length) {
      return reply(res, "Il catalogo sarà presto disponibile. Stiamo preparando i primi prodotti.");
    }

    let out = "📚 <b>Catalogo MewingMarket</b>\n\n";
    for (const p of PRODUCTS) {
      out += `• <b>${p.titoloBreve || p.titolo}</b> — ${p.prezzo}€  
<a href="${p.linkPayhip}">${p.linkPayhip}</a>\n\n`;
    }

    out += `Puoi scrivere il nome di un prodotto o il tuo obiettivo, e ti consiglio cosa scegliere.`;

    const enriched = await callGPT(
      rawText || "Mostra catalogo",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase finale che inviti a chiedere consiglio.",
      { products: PRODUCTS }
    );

    return reply(res, out + "\n\n" + (enriched || ""));
  }

  // ------------------------------
  // NEWSLETTER
  // ------------------------------
  if (intent === "newsletter") {
    setState(req, "newsletter");

    // DISISCRIZIONE
    if (sub === "unsubscribe") {
      const base = `
Vuoi annullare l'iscrizione alla newsletter?

Puoi farlo da qui:  
<a href="disiscriviti.html">disiscriviti.html</a>

Se hai problemi, scrivici:  
supporto@mewingmarket.it

Hai bisogno di altro o vuoi tornare al menu?
`;

      const enriched = await callGPT(
        rawText || "Disiscrizione newsletter",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più empatico ma chiaro."
      );

      return reply(res, enriched || base);
    }

    // ISCRIZIONE
    const base = `
Vuoi iscriverti alla newsletter di MewingMarket?

Riceverai:  
• contenuti utili  
• aggiornamenti sui prodotti  
• novità e risorse pratiche  

Puoi iscriverti da qui:  
<a href="iscrizione.html">iscrizione.html</a>

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Iscrizione newsletter",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più motivante, senza esagerare."
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // SOCIAL SPECIFICI
  // ------------------------------
  if (intent === "social_specifico") {
    const socials = {
      instagram: "https://www.instagram.com/mewingmarket",
      tiktok: "https://www.tiktok.com/@mewingmarket",
      youtube: "https://www.youtube.com/@mewingmarket2",
      facebook: "https://www.facebook.com/profile.php?id=61584779793628",
      x: "https://x.com/mewingm8",
      threads: "https://www.threads.net/@mewingmarket",
      linkedin: "https://www.linkedin.com/company/mewingmarket"
    };

    const link = socials[sub];

    const base = `
Ecco il nostro profilo ${sub.charAt(0).toUpperCase() + sub.slice(1)} 📲  
<a href="${link}">${link}</a>

Vuoi vedere anche gli altri social o tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Mostra social " + sub,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che spieghi cosa trova l’utente su questo social."
    );

    return reply(res, enriched || base);
  }

  // ------------------------------
  // SOCIAL GENERICO
  // ------------------------------
  if (intent === "social") {
    const base = `
Ecco i nostri social ufficiali 📲

Instagram: <a href="https://www.instagram.com/mewingmarket">Instagram</a>  
TikTok: <a href="https://www.tiktok.com/@mewingmarket">TikTok</a>  
YouTube: <a href="https://www.youtube.com/@mewingmarket2">YouTube</a>  
Facebook: <a href="https://www.facebook.com/profile.php?id=61584779793628">Facebook</a>  
X: <a href="https://x.com/mewingm8">X</a>  
Threads: <a href="https://www.threads.net/@mewingmarket">Threads</a>  
LinkedIn: <a href="https://www.linkedin.com/company/mewingmarket">LinkedIn</a>

Vuoi tornare al menu o vedere il catalogo?
`;

    const enriched = await callGPT(
      rawText || "Mostra social generici",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che inviti a seguire almeno un social."
    );

    return reply(res, enriched || base);
  }

  // ------------------------------
  // PRIVACY
  // ------------------------------
  if (intent === "privacy") {
    const base = `
La Privacy Policy di MewingMarket spiega come gestiamo i tuoi dati.

In sintesi:  
• raccogliamo nome e email per la newsletter  
• i dati di pagamento sono gestiti da Payhip  
• usiamo cookie tecnici e analytics  
• puoi chiedere accesso, modifica o cancellazione dei tuoi dati  

Pagina completa:  
<a href="privacy.html">privacy.html</a>

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Privacy policy",
      Memory.get(uid),
      pageContext,
      "\nRendi il tono più rassicurante."
    );

    return reply(res, enriched || base);
  }

  // ------------------------------
  // TERMINI E CONDIZIONI
  // ------------------------------
  if (intent === "termini") {
    const base = `
I Termini e Condizioni spiegano come funziona MewingMarket.

In sintesi:  
• vendiamo prodotti digitali tramite Payhip  
• l'uso è personale  
• il download è immediato  
• i rimborsi sono valutati caso per caso  

Pagina completa:  
<a href="termini-e-condizioni.html">termini-e-condizioni.html</a>

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Termini e condizioni",
      Memory.get(uid),
      pageContext,
      "\nRendi il tono più umano."
    );

    return reply(res, enriched || base);
  }

  // ------------------------------
  // COOKIE
  // ------------------------------
  if (intent === "cookie") {
    const base = `
Usiamo cookie tecnici e analytics per migliorare il sito.

Pagina completa:  
<a href="cookie.html">cookie.html</a>

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Cookie policy",
      Memory.get(uid),
      pageContext,
      "\nNormalizza l'uso dei cookie senza banalizzare."
    );

    return reply(res, enriched || base);
  }

  // ------------------------------
  // RESI E RIMBORSI
  // ------------------------------
  if (intent === "resi") {
    const base = `
I prodotti digitali non prevedono reso automatico, ma valutiamo ogni richiesta caso per caso.

Pagina completa:  
<a href="resi.html">resi.html</a>

Se hai un problema specifico, scrivici:  
supporto@mewingmarket.it  
WhatsApp: 352 026 6660

Hai bisogno di altro o vuoi tornare al menu?
`;

    const enriched = await callGPT(
      rawText || "Resi e rimborsi",
      Memory.get(uid),
      pageContext,
      "\nRendi il tono fermo ma comprensivo."
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // FAQ
  // ------------------------------
  if (intent === "faq") {
    const base = `
Puoi consultare le FAQ qui:  
<a href="FAQ.html">FAQ.html</a>

Se non trovi la risposta, scrivici:  
supporto@mewingmarket.it

Vuoi tornare al menu o hai bisogno di altro?
`;

    const enriched = await callGPT(
      rawText || "FAQ",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che inviti a chiedere se non trova la risposta."
    );

    return reply(res, enriched || base);
  }

  // ------------------------------
  // CONTATTI
  // ------------------------------
  if (intent === "contatti") {
    const base = `
Ecco i contatti ufficiali MewingMarket:

Vendite: vendite@mewingmarket.it  
Supporto: supporto@mewingmarket.it  
Email alternative: MewingMarket@outlook.it, mewingmarket2@gmail.com  
WhatsApp Business: 352 026 6660  

Pagina contatti:  
<a href="contatti.html">contatti.html</a>

Vuoi tornare al menu o vedere il catalogo?
`;

    const enriched = await callGPT(
      rawText || "Contatti",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che spieghi quando usare vendite e quando supporto."
    );

    return reply(res, enriched || base);
  }

  // ------------------------------
  // DOVE SIAMO
  // ------------------------------
  if (intent === "dovesiamo") {
    const base = `
La sede di MewingMarket è:

Strada Ciousse 35  
18038 Sanremo (IM) — Italia  

Pagina:  
<a href="dovesiamo.html">dovesiamo.html</a>

Vuoi tornare al menu o hai bisogno di altro?
`;

    const enriched = await callGPT(
      rawText || "Dove siamo",
      Memory.get(uid),
      pageContext,
      "\nNormalizza il fatto che il progetto è digitale ma ha una base reale."
    );

    return reply(res, enriched || base);
  }

  // ------------------------------
  // SUPPORTO
  // ------------------------------
  if (intent === "supporto") {
    setState(req, "supporto");

    // DOWNLOAD
    if (sub === "download") {
      const base = `
Se non riesci a scaricare il prodotto:

1. Controlla la tua email (anche spam).  
2. Recupera il link da Payhip con la stessa email dell'acquisto.  
3. Prova un altro browser o dispositivo.  

Se non funziona:  
supporto@mewingmarket.it  
WhatsApp: 352 026 6660

Vuoi tornare al menu o hai bisogno di altro?
`;

      const enriched = await callGPT(
        rawText || "Supporto download",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più guidato e rassicurante."
      );

      return reply(res, enriched || base);
    }

    // PAYHIP
    if (sub === "payhip") {
      const base = `
Payhip gestisce pagamenti e download.

Dopo il pagamento ricevi subito un’email con il link.  
Puoi accedere anche dalla tua area Payhip.

Se hai problemi:  
supporto@mewingmarket.it  
WhatsApp: 352 026 6660

Vuoi tornare al menu o hai bisogno di altro?
`;

      const enriched = await callGPT(
        rawText || "Supporto Payhip",
        Memory.get(uid),
        pageContext,
        "\nRendi il tono rassicurante."
      );

      return reply(res, enriched || base);
    }

    // RIMBORSO
    if (sub === "rimborso") {
      const base = `
I prodotti digitali non prevedono reso automatico, ma valutiamo ogni caso.

Scrivici:  
supporto@mewingmarket.it  
WhatsApp: 352 026 6660  

Pagina:  
<a href="resi.html">resi.html</a>

Vuoi tornare al menu o hai bisogno di altro?
`;

      const enriched = await callGPT(
        rawText || "Supporto rimborso",
        Memory.get(uid),
        pageContext,
        "\nRendi il tono fermo ma gentile."
      );

      return reply(res, enriched || base);
    }

    // CONTATTO DIRETTO
    if (sub === "contatto") {
      const base = `
Puoi contattare il supporto:

supporto@mewingmarket.it  
WhatsApp: 352 026 6660  

Siamo disponibili per:  
• problemi di download  
• informazioni sui prodotti  
• assistenza sugli acquisti  

Vuoi tornare al menu o hai bisogno di altro?
`;

      const enriched = await callGPT(
        rawText || "Supporto contatto",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a descrivere bene il problema."
      );

      return reply(res, enriched || base);
    }

    // SUPPORTO GENERICO
    const base = `
Sono qui per aiutarti 💬  
Scrivi una parola chiave come:  
"download", "payhip", "rimborso", "contatto".
`;

    const enriched = await callGPT(
      rawText || "Supporto generico",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più naturale."
    );

    return reply(res, enriched || base);
        }// ------------------------------
  // PRODOTTI
  // ------------------------------
  const lastProductSlug = state.lastProductSlug;

  if (intent === "prodotto") {
    let product = null;

    if (sub) product = findProductBySlug(sub);
    if (!product) product = fuzzyMatchProduct(rawText);
    if (!product && normalize(rawText).includes("ecosistema")) {
      product = findProductBySlug(MAIN_PRODUCT_SLUG);
    }

    if (!product) {
      const base = `
Non ho capito bene quale prodotto ti interessa.

Scrivi il nome del prodotto o "catalogo".
`;

      const enriched = await callGPT(
        rawText || "Prodotto non chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più simile a una chat reale."
      );

      return reply(res, enriched || base);
    }

    state.lastProductSlug = product.slug;
    setState(req, "prodotto");

    const base = productReply(product) + `

Vuoi:
• capire se è adatto a te  
• confrontarlo con altri  
• andare all’acquisto  
`;

    const enriched = await callGPT(
      rawText || "Prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase finale che aiuti a fare il passo successivo.",
      { product }
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // ACQUISTO DIRETTO
  // ------------------------------
  if (intent === "acquisto_diretto") {
    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);

    if (!product) {
      const base = `
Non ho capito quale prodotto vuoi acquistare.

Scrivi il nome del prodotto o "catalogo".
`;

      const enriched = await callGPT(
        rawText || "Acquisto senza prodotto chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più conversazionale."
      );

      return reply(res, enriched || base);
    }

    state.lastProductSlug = product.slug;
    setState(req, "acquisto_diretto");

    const base = `
Perfetto.

📘 <b>${product.titolo}</b>  
💰 <b>${product.prezzo}€</b>  

Acquisto diretto:  
<a href="${product.linkPayhip}">${product.linkPayhip}</a>

Dopo il pagamento ricevi subito il file.  
Vuoi un consiglio su come iniziare?
`;

    const enriched = await callGPT(
      rawText || "Acquisto diretto prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase finale che rinforzi il valore del prodotto.",
      { product }
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // DETTAGLI PRODOTTO
  // ------------------------------
  if (intent === "dettagli_prodotto") {
    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);

    if (!product) {
      const base = `
Dimmi il nome del prodotto di cui vuoi i dettagli  
(es. "Ecosistema Digitale", "Business Digitale AI", "Planner Produttività AI").
`;

      const enriched = await callGPT(
        rawText || "Dettagli prodotto senza nome chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più amichevole."
      );

      return reply(res, enriched || base);
    }

    state.lastProductSlug = product.slug;
    setState(req, "dettagli_prodotto");

    const base = productLongReply(product) + `

Vuoi:
• un confronto con altri prodotti  
• capire se è adatto alla tua situazione  
• andare all’acquisto  
`;

    const enriched = await callGPT(
      rawText || "Dettagli prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase finale che aiuti a decidere.",
      { product }
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // VIDEO PRODOTTO
  // ------------------------------
  if (intent === "video_prodotto") {
    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);

    if (!product) {
      const base = `
Non ho capito a quale prodotto ti riferisci per il video.

Scrivi:
• "video ecosistema"  
• "video business ai"  
• oppure il nome del prodotto.
`;

      const enriched = await callGPT(
        rawText || "Video prodotto senza nome chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più naturale."
      );

      return reply(res, enriched || base);
    }

    if (!product.youtube_url) {
      const base = `
Questo prodotto non ha un video ufficiale, ma posso spiegarti in modo chiaro cosa contiene e come usarlo.

Preferisci:
• spiegazione veloce  
• spiegazione completa  
`;

      const enriched = await callGPT(
        rawText || "Video non disponibile per " + product.titolo,
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più motivante.",
        { product }
      );

      return reply(res, enriched || base);
    }

    state.lastProductSlug = product.slug;
    setState(req, "video_prodotto");

    const base = `
🎥 <b>Video di presentazione di ${product.titolo}</b>  
<a href="${product.youtube_url}">${product.youtube_url}</a>

Vuoi un riassunto dei punti chiave?
`;

    const enriched = await callGPT(
      rawText || "Video prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che inviti a guardare il video con uno scopo preciso.",
      { product }
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // PREZZO PRODOTTO
  // ------------------------------
  if (intent === "prezzo_prodotto") {
    let product = fuzzyMatchProduct(rawText);
    if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);

    if (!product) {
      const base = `
Dimmi il nome del prodotto di cui vuoi sapere il prezzo  
(es. "Ecosistema Digitale", "Business Digitale AI", "Planner Produttività AI").
`;

      const enriched = await callGPT(
        rawText || "Prezzo prodotto senza nome chiaro",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più colloquiale."
      );

      return reply(res, enriched || base);
    }

    state.lastProductSlug = product.slug;
    setState(req, "prezzo_prodotto");

    const base = `
📘 <b>${product.titolo}</b>  
💰 <b>Prezzo:</b> ${product.prezzo}€

Vuoi:
• capire cosa ottieni esattamente  
• confrontarlo con altri prodotti  
• andare all’acquisto  
`;

    const enriched = await callGPT(
      rawText || "Prezzo prodotto " + product.titolo,
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che aiuti a percepire il valore.",
      { product }
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // TRATTATIVA / SCONTO
  // ------------------------------
  if (intent === "trattativa" && sub === "sconto") {
    const base = `
Capisco la domanda sullo sconto.

MewingMarket non lavora a sconti continui, perché ogni prodotto è pensato per farti risparmiare:
• tempo  
• errori  
• complessità  

Piuttosto che abbassare il prezzo, preferiamo aumentare il valore.

Se vuoi, ti spiego in modo diretto:
• cosa risolve il prodotto che stai valutando  
• perché può valere l’investimento per te  
`;

    const enriched = await callGPT(
      rawText || "Richiesta sconto",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio fermo ma rispettoso, come in una trattativa seria."
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // OBIETTA PREZZO
  // ------------------------------
  if (intent === "obiezione" && sub === "prezzo") {
    const base = `
Capisco il dubbio sul prezzo, è una domanda intelligente.

Il punto non è pagare per un file, ma per:
• una struttura già pronta  
• un metodo che ti evita errori  
• una guida che ti fa risparmiare tempo e fatica  

Se mi dici in che situazione sei (es. "sto iniziando", "sono già avviato", "sono bloccato"), posso dirti in modo onesto se il prodotto ha senso per te oppure no.
`;

    const enriched = await callGPT(
      rawText || "Obiezione prezzo",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio un po' più empatico, senza togliere fermezza."
    );

    return reply(res, enriched || base);
  }// ------------------------------
  // FALLBACK INTELLIGENTE FINALE
  // ------------------------------
  const risposta = await callGPT(rawText, Memory.get(uid), pageContext);
  return reply(res, risposta);
}// ------------------------------
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
