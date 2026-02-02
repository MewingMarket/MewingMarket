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

function extractUTM(req) {
  try {
    return req.body?.utm || {};
  } catch {
    return {};
  }
}

function trackBotEvent(event, data = {}) {
  try {
    if (global.trackEvent) {
      global.trackEvent("bot_" + event, data);
    }
  } catch (err) {
    console.error("Bot tracking error:", err);
  }
}

function trackBot(event, data = {}) {
  try {
    if (global.trackEvent) {
      global.trackEvent(event, data);
    }
  } catch (e) {
    console.error("Tracking bot error:", e);
  }
}

const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket, integrato nel sito.
Tono: chiaro, diretto, professionale, amichevole.
Non inventare prodotti o prezzi. Consiglia solo ciò che esiste.
`; async function callGPT(userPrompt, memory = [], context = {}, extraSystem = "", extraData = {}) {
  try {
    const system = BASE_SYSTEM_PROMPT + (extraSystem || "");

    const payload = {
      model: "meta-llama/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: system },
        { role: "assistant", content: "Memoria recente: " + JSON.stringify(memory.slice(-6) || []) },
        { role: "assistant", content: "Contesto pagina: " + JSON.stringify(context || {}) },
        { role: "assistant", content: "Dati strutturati disponibili: " + JSON.stringify(extraData || {}) },
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
    const out = json?.choices?.[0]?.message?.content?.trim();

    if (!out) return "Sono qui 👋 Dimmi pure come posso aiutarti.";
    return out;

  } catch (err) {
    console.error("GPT error:", err);
    return "Sto avendo un piccolo problema tecnico, ma ci sono 👍";
  }
}

function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

function setState(req, newState) {
  if (req.userState && typeof req.userState === "object") {
    req.userState.state = newState;
  }
}

function reply(res, text, meta = {}) {
  try {
    trackBotEvent("reply", {
      reply: text,
      intent: meta.intent || null,
      sub: meta.sub || null,
      uid: meta.uid || null,
      utm: meta.utm || null,
      page: meta.page || null
    });
  } catch (e) {
    console.error("Bot reply tracking error:", e);
  }

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
} function buildProductIndex() {
  const products = getProducts() || [];

  return products.map(p => {
    const titolo = (p.titolo || "").toLowerCase();
    const slug = (p.slug || "").toLowerCase();
    const synonyms = [];

    if (titolo.includes("ecosistema")) {
      synonyms.push("ecosistema","ecosistema digitale","eco sistema","ecosist","ecos","guida ecosistema","ecosistema reale");
    }

    if (titolo.includes("business") && titolo.includes("ai")) {
      synonyms.push("business ai","business digitale ai","business digitale","business 90 giorni","ai business","business plan ai");
    }

    if (titolo.includes("contenuti")) {
      synonyms.push("contenuti","content","creare contenuti","guida contenuti","contenuto","content creation");
    }

    if (titolo.includes("competenze")) {
      synonyms.push("competenze","analisi competenze","skill","analisi delle competenze","valutazione competenze");
    }

    if (titolo.includes("produttività") || titolo.includes("planner")) {
      synonyms.push("produttività","produttivita","planner ai","planner produttività","planner","produttività ai");
    }

    if (titolo.includes("business plan")) {
      synonyms.push("business plan","workbook business plan","plan","piano business","piano aziendale");
    }

    if (titolo.includes("fiscale") || titolo.includes("forfettario") || titolo.includes("flessinance")) {
      synonyms.push("forfettario","guida fiscale","fisco","flessinance","tasse","guida forfettario");
    }

    return { ...p, _index: { titolo, slug, synonyms } };
  });
}

function textIncludesAny(text, arr) {
  const t = text.toLowerCase();
  return arr.some(k => t.includes(k.toLowerCase()));
}

function fuzzyMatchProduct(text) {
  const products = buildProductIndex();
  const t = (text || "").toLowerCase();

  for (const p of products) {
    if (t.includes(p._index.slug) || t.includes(p._index.titolo)) return p;
  }

  for (const p of products) {
    if (textIncludesAny(t, p._index.synonyms)) return p;
  }

  const keywords = t.split(/\s+/).filter(w => w.length > 3);
  if (keywords.length) {
    for (const p of products) {
      if (keywords.some(k => p._index.titolo.includes(k))) return p;
    }
  }

  return null;
} function detectIntent(rawText) {
  const text = rawText || "";
  const t = normalize(text);
  const q = cleanSearchQuery(text);

  trackBot("intent_detect", { text: rawText });

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
  ) return { intent: "conversazione", sub: null };

  if (
    q.includes("menu") ||
    q.includes("inizio") ||
    q.includes("start") ||
    q.includes("opzioni") ||
    q.includes("help") ||
    q.includes("aiuto")
  ) return { intent: "menu", sub: null };

  if (
    q.includes("catalogo") ||
    q.includes("prodotti") ||
    q.includes("store") ||
    q.includes("shop")
  ) return { intent: "catalogo", sub: null };

  if (
    q.includes("iscrizione") ||
    q.includes("mi iscrivo") ||
    q.includes("voglio iscrivermi") ||
    q.includes("registrazione")
  ) return { intent: "newsletter", sub: "subscribe" };

  if (
    q.includes("newsletter") ||
    q.includes("iscrivermi") ||
    q.includes("iscriviti") ||
    q.includes("disiscriv") ||
    q.includes("annulla iscrizione")
  ) {
    if (q.includes("disiscriv") || q.includes("annulla"))
      return { intent: "newsletter", sub: "unsubscribe" };
    return { intent: "newsletter", sub: "subscribe" };
  }

  if (q.includes("instagram")) return { intent: "social_specifico", sub: "instagram" };
  if (q.includes("tiktok")) return { intent: "social_specifico", sub: "tiktok" };
  if (q.includes("youtube")) return { intent: "social_specifico", sub: "youtube" };
  if (q.includes("facebook")) return { intent: "social_specifico", sub: "facebook" };
  if (q.includes("threads")) return { intent: "social_specifico", sub: "threads" };
  if (q.includes("linkedin")) return { intent: "social_specifico", sub: "linkedin" };
  if (q.includes("x ") || q === "x") return { intent: "social_specifico", sub: "x" };

  if (q.includes("social")) return { intent: "social", sub: null };

  if (q.includes("privacy") || q.includes("dati") || q.includes("gdpr"))
    return { intent: "privacy", sub: null };

  if (q.includes("termini") || q.includes("condizioni") || q.includes("terms"))
    return { intent: "termini", sub: null };

  if (q.includes("cookie")) return { intent: "cookie", sub: null };

  if (q.includes("resi") || q.includes("rimborsi") || q.includes("rimborso"))
    return { intent: "resi", sub: null };

  if (q.includes("faq")) return { intent: "faq", sub: null };

  if (
    q.includes("contatti") ||
    q.includes("contatto") ||
    q.includes("email") ||
    q.includes("whatsapp") ||
    q.includes("numero") ||
    q.includes("telefono")
  ) return { intent: "contatti", sub: null };

  if (
    q.includes("dove siamo") ||
    q.includes("indirizzo") ||
    q.includes("sede")
  ) return { intent: "dovesiamo", sub: null };

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
    if (q.includes("scaricare") || q.includes("download"))
      return { intent: "supporto", sub: "download" };
    if (q.includes("payhip"))
      return { intent: "supporto", sub: "payhip" };
    if (q.includes("rimborso") || q.includes("resi"))
      return { intent: "supporto", sub: "rimborso" };
    if (q.includes("email") || q.includes("contatto") || q.includes("contattare"))
      return { intent: "supporto", sub: "contatto" };
    return { intent: "supporto", sub: null };
  }

  if (
    q.includes("acquisto") ||
    q.includes("fare un acquisto") ||
    q.includes("voglio acquistare") ||
    q.includes("procedo all acquisto") ||
    q.includes("procedo all'acquisto")
  ) return { intent: "acquisto_diretto", sub: null };

  if (
    q.includes("acquista") ||
    q.includes("compra") ||
    q.includes("prendo") ||
    q.includes("lo prendo") ||
    q.includes("lo compro")
  ) return { intent: "acquisto_diretto", sub: null };

  if (
    q.includes("dettagli") ||
    q.includes("approfondisci") ||
    q.includes("info") ||
    q.includes("informazioni") ||
    q.includes("spiegami meglio")
  ) return { intent: "dettagli_prodotto", sub: null };

  if (
    q.includes("video") ||
    q.includes("anteprima") ||
    q.includes("presentazione")
  ) return { intent: "video_prodotto", sub: null };

  if (
    q.includes("prezzo") ||
    q.includes("quanto costa") ||
    q.includes("costa") ||
    q.includes("costo")
  ) return { intent: "prezzo_prodotto", sub: null };

  if (
    q.includes("sconto") ||
    q.includes("sconti") ||
    q.includes("offerta") ||
    q.includes("promo")
  ) return { intent: "trattativa", sub: "sconto" };

  if (
    q.includes("è caro") ||
    q.includes("troppo caro") ||
    q.includes("non so se vale") ||
    q.includes("non so se mi serve") ||
    q.includes("caro")
  ) return { intent: "obiezione", sub: "prezzo" };

  if (q.includes("ecosistema") || q.includes("da dove inizio") || q.includes("iniziare"))
    return { intent: "ecosistema", sub: null };

  if (q.includes("mindset") || q.includes("motivazione") || q.includes("mentalità"))
    return { intent: "mindset", sub: null };

  if (q.includes("lead magnet") || q.includes("risorsa gratuita") || q.includes("freebie"))
    return { intent: "lead_magnet", sub: null };

  if (q.includes("faq premium") || q.includes("domande avanzate"))
    return { intent: "faq_premium", sub: null };

  const product = fuzzyMatchProduct(text);
  if (product) return { intent: "prodotto", sub: product.slug };

  if (rawText.startsWith("FILE:"))
    return { intent: "allegato", sub: rawText.replace("FILE:", "").trim() };

  if (!rawText || rawText.trim().length < 2)
    return { intent: "menu", sub: null };

  const generic = ["ok","si","sì","eh","boh","yo","ciao","hey","hello"];
  if (generic.includes(rawText.toLowerCase().trim()))
    return { intent: "menu", sub: null };

  return { intent: "gpt", sub: null };
} async function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const state = req.userState || {};
  const PRODUCTS = getProducts() || [];

  state.lastIntent = intent;
  Memory.push(uid, rawText || "");
  const pageContext = Context.get(uid);

  trackBot("conversation_step", { uid, intent, sub, text: rawText });

  const utm = extractUTM(req);

  trackBotEvent("message", {
    uid,
    text: rawText,
    intent,
    sub,
    utm,
    page: pageContext?.page || null
  });

  if (intent === "gpt") {
    const risposta = await callGPT(rawText, Memory.get(uid), pageContext);
    return reply(res, risposta, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

  if (intent === "conversazione") {
    const risposta = await callGPT(
      rawText,
      Memory.get(uid),
      pageContext,
      "\nRispondi in modo amichevole, breve, coerente con il brand MewingMarket, e collega la conversazione ai prodotti o al valore del digitale quando ha senso."
    );
    return reply(res, risposta, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

  if (intent === "catalogo") {
    setState(req, "catalogo");

    if (!PRODUCTS.length) {
      return reply(
        res,
        "Il catalogo sarà presto disponibile. Stiamo preparando i primi prodotti.",
        { intent, sub, uid, utm, page: pageContext?.page || null }
      );
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

    return reply(res, out + "\n\n" + (enriched || ""), {
      intent,
      sub,
      uid,
      utm,
      page: pageContext?.page || null
    });
  }  if (intent === "newsletter") {
    setState(req, "newsletter");

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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
}  if (intent === "supporto") {
    setState(req, "supporto");

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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  } if (intent === "ecosistema") {
    const base = `
L’Ecosistema Digitale è il punto di partenza ideale se vuoi:

• capire come funziona il digitale  
• evitare errori da principiante  
• avere una mappa chiara dei passi da fare  
• sapere quali strumenti usare e in che ordine  

Vuoi che ti dica se è adatto alla tua situazione?
`;

    const enriched = await callGPT(
      rawText || "Ecosistema Digitale",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più motivante e orientato all'azione."
    );

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

  if (intent === "mindset") {
    const base = `
Il mindset è la base di tutto.

Se vuoi posso darti:
• una routine mentale semplice  
• un metodo per restare costante  
• un modo per evitare blocchi e procrastinazione  

Vuoi una routine veloce o un metodo completo?
`;

    const enriched = await callGPT(
      rawText || "Mindset",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più empatico e pratico."
    );

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

  if (intent === "lead_magnet") {
    const base = `
Ecco la risorsa gratuita per iniziare subito 👇  
https://mewingmarket.com/free

Vuoi che ti dica come usarla al meglio?
`;

    const enriched = await callGPT(
      rawText || "Lead magnet",
      Memory.get(uid),
      pageContext,
      "\nAggiungi una frase che inviti a usarla subito."
    );

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

  if (intent === "faq_premium") {
    const base = `
Ecco le FAQ avanzate:  
<a href="FAQ.html">FAQ Premium</a>

Vuoi che ti risponda direttamente a una domanda specifica?
`;

    const enriched = await callGPT(
      rawText || "FAQ Premium",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio più orientato all’aiuto diretto."
    );

    return reply(
      res,
      enriched || base,
      { intent, sub, uid, utm, page: pageContext?.page || null }
    );
  }  const lastProductSlug = state.lastProductSlug;

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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

    state.lastProductSlug = product.slug;
    setState(req, "prodotto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

    state.lastProductSlug = product.slug;
    setState(req, "acquisto_diretto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  } if (intent === "dettagli_prodotto") {
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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

    state.lastProductSlug = product.slug;
    setState(req, "dettagli_prodotto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

    state.lastProductSlug = product.slug;
    setState(req, "video_prodotto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  } if (intent === "prezzo_prodotto") {
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

      return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
    }

    state.lastProductSlug = product.slug;
    setState(req, "prezzo_prodotto");

    trackBotEvent("product_recommendation", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

    trackBotEvent("hot_lead", {
      uid,
      product: product.slug,
      titolo: product.titolo,
      prezzo: product.prezzo,
      intent,
      sub,
      utm,
      page: pageContext?.page || null
    });

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

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

    return reply(res, enriched || base, { intent, sub, uid, utm, page: pageContext?.page || null });
  }

  if (intent === "obiezione" && sub === "prezzo") {
    const base = `
Capisco il dubbio sul prezzo, è una domanda intelligente.

Il punto non è pagare per un file, ma per:
• una struttura già pronta  
• un metodo che ti evita errori  
• una guida che ti fa risparmiare tempo e fatica  

Se mi dici in che situazione sei (es. "sto iniziando", "sono già avviato", "sono bloccato"), posso dirti in modo onesto se il prodotto ha senso per te oppure no.
`;

    trackBotEvent("objection", {
      uid,
      type: "prezzo",
      text: rawText,
      intent,
      sub,
      utm,
      page: pageContext?.page || null,
      lastProduct: state.lastProductSlug || null
    });

    const enriched = await callGPT(
      rawText || "Obiezione prezzo",
      Memory.get(uid),
      pageContext,
      "\nRendi il messaggio un po' più empatico, senza togliere fermezza."
    );

    return reply(
      res,
      enriched,
      { intent, sub, uid, utm, page: pageContext?.page || null }
    );
  }

  if (intent === "allegato") {
    const url = sub || "";

    if (url.endsWith(".pdf")) {
      return reply(
        res,
        "Hai caricato un PDF. Vuoi che lo riassuma o che estragga i punti chiave?",
        { intent, sub, uid, utm, page: pageContext?.page || null }
      );
    }

    if (url.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
      return reply(
        res,
        "Hai caricato un'immagine. Vuoi che la descriva o che analizzi cosa contiene?",
        { intent, sub, uid, utm, page: pageContext?.page || null }
      );
    }

    if (url.endsWith(".txt")) {
      return reply(
        res,
        "Hai caricato un file di testo. Vuoi che lo legga e ti dica cosa contiene?",
        { intent, sub, uid, utm, page: pageContext?.page || null }
      );
    }

    if (url.endsWith(".zip")) {
      return reply(
        res,
        "Hai caricato un file ZIP. Vuoi che ti dica come estrarlo o cosa potrebbe contenere?",
        { intent, sub, uid, utm, page: pageContext?.page || null }
      );
    }

    return reply(
      res,
      "File ricevuto. Vuoi che ti dica cosa posso farci?",
      { intent, sub, uid, utm, page: pageContext?.page || null }
    );
  }

  const risposta = await callGPT(rawText, Memory.get(uid), pageContext);

  if (!risposta || typeof risposta !== "string" || risposta.trim().length < 2) {
    return reply(
      res,
      "Sono qui 👋\n" +
      "Ecco come posso aiutarti subito:\n" +
      "• catalogo — vedere tutti i prodotti\n" +
      "• supporto — problemi download o pagamenti\n" +
      "• contatti — email e WhatsApp\n" +
      "• newsletter — iscrizione o disiscrizione\n" +
      "• consigli — ti suggerisco il prodotto giusto\n\n" +
      "Scrivi una parola chiave e ti indirizzo.",
      { intent, sub, uid, utm, page: pageContext?.page || null }
    );
  }

  return reply(
    res,
    risposta.trim(),
    { intent, sub, uid, utm, page: pageContext?.page || null }
  );
      } module.exports = {
  detectIntent,
  handleConversation,
  reply,
  generateUID,
  setState,
  isYes
};
