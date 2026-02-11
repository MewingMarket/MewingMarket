/**
 * modules/bot.js — VERSIONE BLINDATA, OTTIMIZZATA, AUTO-AGGIORNANTE
 * Struttura migliorata, contenuti identici, blindatura massima.
 */

const fetch = require("node-fetch");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// IMPORT BLINDATI
const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  productReply,
  productLongReply
} = require(path.join(__dirname, "catalogo.cjs"));

const { normalize, cleanSearchQuery } = require(path.join(__dirname, "utils.cjs"));
const { getProducts } = require(path.join(__dirname, "airtable.cjs"));
const Context = require(path.join(__dirname, "context.cjs"));
const Memory = require(path.join(__dirname, "memory.cjs"));

/* ------------------------------
   TRACKING — BLINDATO
------------------------------ */
function trackBot(event, data = {}) {
  try {
    if (global.trackEvent && typeof global.trackEvent === "function") {
      global.trackEvent(event, data);
    }
  } catch (e) {
    console.error("Tracking bot error:", e);
  }
}

/* ------------------------------
   EMOJI BOOSTER — IDENTICO, BLINDATO
------------------------------ */
function addEmojis(text = "") {
  try {
    if (!text || typeof text !== "string") return text || "";
    return text
      .replace(/\bciao\b/gi, "ciao 👋")
      .replace(/\bgrazie\b/gi, "grazie 🙏")
      .replace(/\bok\b/gi, "ok 👍")
      .replace(/\bperfetto\b/gi, "perfetto 😎")
      .replace(/\bottimo\b/gi, "ottimo 🔥")
      .replace(/\bscusa\b/gi, "scusa 😅");
  } catch {
    return text;
  }
}

/* ------------------------------
   GPT CORE — BLINDATISSIMO
------------------------------ */

const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket, integrato nel sito.

Tono:
- chiaro
- diretto
- professionale
- amichevole
- commerciale quando serve

Regole:
- Non inventare prodotti, prezzi o link.
- Usa solo i prodotti presenti nel catalogo.
- Se l'utente chiede consigli: proponi il prodotto più adatto.
- Se l'utente ha dubbi: chiarisci e rassicura.
- Se l'utente è pronto: porta alla chiusura con link Payhip.
- Risposte brevi ma dense.
- Se qualcosa va storto, rispondi comunque in modo utile.
- Non dire mai "non so", trova sempre un modo per aiutare.
`;

async function callGPT(
  userPrompt,
  memory = [],
  context = {},
  extraSystem = "",
  extraData = {}
) {
  try {
    const system = BASE_SYSTEM_PROMPT + (extraSystem || "");

    const payload = {
      model: "meta-llama/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: system },
        { role: "assistant", content: "Memoria: " + JSON.stringify(memory || []) },
        { role: "assistant", content: "Contesto pagina: " + JSON.stringify(context || {}) },
        { role: "assistant", content: "Dati: " + JSON.stringify(extraData || {}) },
        { role: "user", content: userPrompt || "" }
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
    const out = json?.choices?.[0]?.message?.content;

    if (out && typeof out === "string") {
      return addEmojis(out.trim());
    }

    // FALLBACK 1 — modello alternativo
    const fallbackPayload = {
      model: "google/gemini-flash-1.5",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt || "" }
      ]
    };

    const res2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(fallbackPayload)
    });

    const json2 = await res2.json();
    const out2 = json2?.choices?.[0]?.message?.content;

    if (out2 && typeof out2 === "string") {
      return addEmojis(out2.trim());
    }

    // FALLBACK 2 — risposta di emergenza
    return addEmojis(
      "Sto avendo un problema tecnico, ma non ti lascio fermo: dimmi cosa vuoi ottenere e ti do subito una mano."
    );

  } catch (err) {
    console.error("GPT error:", err);

    // FALLBACK 3 — ultimo livello
    return addEmojis(
      "C’è un problema temporaneo, ma posso comunque aiutarti: dimmi cosa vuoi fare e ti guido."
    );
  }
}

/* ------------------------------
   TRASCRIZIONE VOCALE — BLINDATA
------------------------------ */
async function transcribeAudio(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return "Non riesco a leggere il file audio, puoi riprovare?";
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("model", "openai/whisper-1");

    const res = await axios.post(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
      }
    );

    return res.data?.text || "Non riesco a capire il vocale 😅";

  } catch (err) {
    console.error("Errore Whisper:", err);
    return "Il vocale non è chiaro, puoi ripetere?";
  }
}

/* ------------------------------
   UTILS DI STATO — BLINDATI
------------------------------ */
function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

function setState(req, newState) {
  try {
    if (req.userState && typeof req.userState === "object") {
      req.userState.state = newState;
    }
  } catch (e) {
    console.error("Errore setState:", e);
  }
}

function reply(res, text) {
  try {
    trackBot("bot_reply", { text });
    res.json({ reply: addEmojis(text || "") });
  } catch (e) {
    console.error("Errore reply:", e);
    res.json({ reply: "Sto avendo un problema tecnico, ma posso aiutarti comunque." });
  }
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
          } /* ------------------------------
   DETECT INTENT — VERSIONE SUPER BLINDATA
------------------------------ */

function detectIntent(rawText) {
  try {
    const text = rawText || "";
    const t = normalize(text || "");
    const q = cleanSearchQuery(text || "");

    trackBot("intent_detect", { text: rawText });

    // Conversazione generale
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

    // Menu
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

    // Catalogo
    if (
      q.includes("catalogo") ||
      q.includes("prodotti") ||
      q.includes("store") ||
      q.includes("shop")
    ) {
      return { intent: "catalogo", sub: null };
    }

    // Newsletter
    if (
      q.includes("iscrizione") ||
      q.includes("mi iscrivo") ||
      q.includes("voglio iscrivermi") ||
      q.includes("registrazione")
    ) {
      return { intent: "newsletter", sub: "subscribe" };
    }

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

    // Social specifici
    if (q.includes("instagram")) return { intent: "social_specifico", sub: "instagram" };
    if (q.includes("tiktok")) return { intent: "social_specifico", sub: "tiktok" };
    if (q.includes("youtube")) return { intent: "social_specifico", sub: "youtube" };
    if (q.includes("facebook")) return { intent: "social_specifico", sub: "facebook" };
    if (q.includes("threads")) return { intent: "social_specifico", sub: "threads" };
    if (q.includes("linkedin")) return { intent: "social_specifico", sub: "linkedin" };
    if (q === "x" || q.includes("x ")) return { intent: "social_specifico", sub: "x" };

    // Social generico
    if (q.includes("social")) {
      return { intent: "social", sub: null };
    }

    // Privacy
    if (q.includes("privacy") || q.includes("dati") || q.includes("gdpr")) {
      return { intent: "privacy", sub: null };
    }

    // Termini
    if (q.includes("termini") || q.includes("condizioni") || q.includes("terms")) {
      return { intent: "termini", sub: null };
    }

    // Cookie
    if (q.includes("cookie")) {
      return { intent: "cookie", sub: null };
    }

    // Resi
    if (q.includes("resi") || q.includes("rimborsi") || q.includes("rimborso")) {
      return { intent: "resi", sub: null };
    }

    // FAQ
    if (q.includes("faq")) {
      return { intent: "faq", sub: null };
    }

    // Contatti
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

    // Dove siamo
    if (
      q.includes("dove siamo") ||
      q.includes("indirizzo") ||
      q.includes("sede")
    ) {
      return { intent: "dovesiamo", sub: null };
    }

    // Supporto
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

    // Acquisto diretto
    if (
      q.includes("acquisto") ||
      q.includes("fare un acquisto") ||
      q.includes("voglio acquistare") ||
      q.includes("procedo all acquisto") ||
      q.includes("procedo all'acquisto")
    ) {
      return { intent: "acquisto_diretto", sub: null };
    }

    if (
      q.includes("acquista") ||
      q.includes("compra") ||
      q.includes("prendo") ||
      q.includes("lo prendo") ||
      q.includes("lo compro")
    ) {
      return { intent: "acquisto_diretto", sub: null };
    }

    // Dettagli prodotto
    if (
      q.includes("dettagli") ||
      q.includes("approfondisci") ||
      q.includes("info") ||
      q.includes("informazioni") ||
      q.includes("spiegami meglio")
    ) {
      return { intent: "dettagli_prodotto", sub: null };
    }

    // Video prodotto
    if (
      q.includes("video") ||
      q.includes("anteprima") ||
      q.includes("presentazione")
    ) {
      return { intent: "video_prodotto", sub: null };
    }

    // Prezzo prodotto
    if (
      q.includes("prezzo") ||
      q.includes("quanto costa") ||
      q.includes("costa") ||
      q.includes("costo")
    ) {
      return { intent: "prezzo_prodotto", sub: null };
    }

    // Trattativa
    if (
      q.includes("sconto") ||
      q.includes("sconti") ||
      q.includes("offerta") ||
      q.includes("promo")
    ) {
      return { intent: "trattativa", sub: "sconto" };
    }

    // Obiezioni
    if (
      q.includes("è caro") ||
      q.includes("troppo caro") ||
      q.includes("non so se vale") ||
      q.includes("non so se mi serve") ||
      q.includes("caro")
    ) {
      return { intent: "obiezione", sub: "prezzo" };
    }

    // Match prodotto fuzzy
    const product = fuzzyMatchProduct(text);
    if (product) {
      return { intent: "prodotto", sub: product.slug };
    }

    // Allegati
    if (rawText && rawText.startsWith("FILE:")) {
      return { intent: "allegato", sub: rawText.replace("FILE:", "").trim() };
    }

    // Fallback GPT
    return { intent: "gpt", sub: null };

  } catch (err) {
    console.error("Errore detectIntent:", err);
    return { intent: "gpt", sub: null };
  }
                 }  /* ------------------------------
   HANDLE CONVERSATION — GPT-FIRST, COMMERCIALE, COMPLETO
   VERSIONE BLINDATA E STRUTTURATA
------------------------------ */

async function handleConversation(req, res, intent, sub, rawText) {
  try {
    const uid = req?.uid || "unknown_user";
    const state = req?.userState || {};
    const PRODUCTS = (() => {
      try {
        return getProducts() || [];
      } catch (e) {
        console.error("Errore getProducts:", e);
        return [];
      }
    })();

    // Stato utente
    try {
      state.lastIntent = intent;
      Memory.push(uid, rawText || "");
    } catch (e) {
      console.error("Errore Memory.push:", e);
    }

    const pageContext = (() => {
      try {
        return Context.get(uid) || {};
      } catch (e) {
        console.error("Errore Context.get:", e);
        return {};
      }
    })();

    trackBot("conversation_step", { uid, intent, sub, text: rawText });

    /* ------------------------------------------
       GPT FALLBACK / GENERALE
    ------------------------------------------ */
    if (intent === "gpt") {
      const risposta = await callGPT(
        rawText || "",
        Memory.get(uid),
        pageContext
      );
      return reply(res, risposta || "Dimmi pure come posso aiutarti.");
    }

    /* ------------------------------------------
       CONVERSAZIONE GENERALE
    ------------------------------------------ */
    if (intent === "conversazione") {
      const risposta = await callGPT(
        rawText || "",
        Memory.get(uid),
        pageContext,
        "\nRispondi in modo amichevole, breve, coerente con il brand MewingMarket, e collega la conversazione ai prodotti o al valore del digitale quando ha senso."
      );
      return reply(res, risposta || "Dimmi pure come posso aiutarti 😊");
    }

    /* ------------------------------------------
       MENU
    ------------------------------------------ */
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
    }

    /* ------------------------------------------
       CATALOGO
    ------------------------------------------ */
    if (intent === "catalogo") {
      setState(req, "catalogo");

      if (!PRODUCTS.length) {
        return reply(
          res,
          "Il catalogo sarà presto disponibile. Stiamo preparando i primi prodotti."
        );
      }

      let out = "📚 <b>Catalogo MewingMarket</b>\n\n";

      for (const p of PRODUCTS) {
        try {
          out += `• <b>${p.titoloBreve || p.titolo}</b> — ${p.prezzo}€  
<a href="${p.linkPayhip}">${p.linkPayhip}</a>\n\n`;
        } catch (e) {
          console.error("Errore generazione catalogo:", e);
        }
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

    /* ------------------------------------------
       NEWSLETTER
    ------------------------------------------ */
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
    }

    /* ------------------------------------------
       SOCIAL SPECIFICO
    ------------------------------------------ */
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

      if (!link) {
        return reply(res, "Non trovo questo social, vuoi vedere la lista completa?");
      }

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

    /* ------------------------------------------
       SOCIAL GENERICO
    ------------------------------------------ */
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
        }  /* ------------------------------------------
       PRIVACY
    ------------------------------------------ */
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

    /* ------------------------------------------
       TERMINI E CONDIZIONI
    ------------------------------------------ */
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

    /* ------------------------------------------
       COOKIE
    ------------------------------------------ */
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

    /* ------------------------------------------
       RESI E RIMBORSI
    ------------------------------------------ */
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
    }

    /* ------------------------------------------
       FAQ
    ------------------------------------------ */
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

    /* ------------------------------------------
       CONTATTI
    ------------------------------------------ */
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

    /* ------------------------------------------
       DOVE SIAMO
    ------------------------------------------ */
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

    /* ------------------------------------------
       SUPPORTO
    ------------------------------------------ */
    if (intent === "supporto") {
      setState(req, "supporto");

      /* --- SUPPORTO DOWNLOAD --- */
      if (sub === "download") {
        const base = `
Se non riesci a scaricare il prodotto:

1. Controlla la tua email (anche spam).  
2. Recupera il link da Payhip con la stessa email dell'acquisto.  
3. Prova un altro browser o dispositivo.  

FAQ utili:  
<a href="FAQ.html">FAQ.html</a>

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

      /* --- SUPPORTO PAYHIP --- */
      if (sub === "payhip") {
        const base = `
Payhip gestisce pagamenti e download.

Dopo il pagamento ricevi subito un’email con il link.  
Puoi accedere anche dalla tua area Payhip.

FAQ utili:  
<a href="FAQ.html">FAQ.html</a>

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

      /* --- SUPPORTO RIMBORSO --- */
      if (sub === "rimborso") {
        const base = `
FAQ utili:  
<a href="FAQ.html">FAQ.html</a>

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

      /* --- SUPPORTO CONTATTO --- */
      if (sub === "contatto") {
        const base = `
Puoi contattare il supporto:

supporto@mewingmarket.it  
WhatsApp: 352 026 6660  

FAQ utili:  
<a href="FAQ.html">FAQ.html</a>

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

      /* --- SUPPORTO GENERICO --- */
      const base = `
Sono qui per aiutarti 💬  
Scrivi una parola chiave come:  
"download", "payhip", "rimborso", "contatto".

FAQ utili:  
<a href="FAQ.html">FAQ.html</a>
`;

      const enriched = await callGPT(
        rawText || "Supporto generico",
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più naturale."
      );

      return reply(res, enriched || base);
  }  /* ------------------------------------------
       PRODOTTI
    ------------------------------------------ */
    const lastProductSlug = state?.lastProductSlug || null;

    if (intent === "prodotto") {
      let product = null;

      try {
        if (sub) product = findProductBySlug(sub);
        if (!product) product = fuzzyMatchProduct(rawText || "");
        if (!product && normalize(rawText || "").includes("ecosistema")) {
          product = findProductBySlug(MAIN_PRODUCT_SLUG);
        }
      } catch (e) {
        console.error("Errore match prodotto:", e);
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

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "prodotto");

      const base = productReply(product) + `

Vuoi:
• capire se è adatto a te  
• confrontarlo con altri  
• andare all’acquisto  
`;

      const enriched = await callGPT(
        rawText || "Prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase finale che aiuti a fare il passo successivo.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       ACQUISTO DIRETTO
    ------------------------------------------ */
    if (intent === "acquisto_diretto") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (e) {
        console.error("Errore acquisto fuzzy:", e);
      }

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

      try {
        state.lastProductSlug = product.slug;
      } catch {}

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
        rawText || "Acquisto diretto prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase finale che rinforzi il valore del prodotto.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       DETTAGLI PRODOTTO
    ------------------------------------------ */
    if (intent === "dettagli_prodotto") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (e) {
        console.error("Errore dettagli fuzzy:", e);
      }

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

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "dettagli_prodotto");

      const base = productLongReply(product) + `

Vuoi:
• un confronto con altri prodotti  
• capire se è adatto alla tua situazione  
• andare all’acquisto  
`;

      const enriched = await callGPT(
        rawText || "Dettagli prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase finale che aiuti a decidere.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       VIDEO PRODOTTO
    ------------------------------------------ */
    if (intent === "video_prodotto") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (e) {
        console.error("Errore video fuzzy:", e);
      }

      if (!product) {
        const base = `
Dimmi il nome del prodotto di cui vuoi vedere il video.
`;

        const enriched = await callGPT(
          rawText || "Video prodotto senza nome chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più naturale."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "video_prodotto");

      if (!product.youtube_url) {
        const base = `
Questo prodotto non ha un video di presentazione, ma posso spiegartelo in modo chiaro.

Vuoi una spiegazione dettagliata?
`;

        const enriched = await callGPT(
          rawText || "Prodotto senza video",
          Memory.get(uid),
          pageContext,
          "\nAggiungi una frase che inviti a chiedere dettagli."
        );

        return reply(res, enriched || base);
      }

      const base = `
Ecco il video di presentazione 🎥  
<a href="${product.youtube_url}">${product.youtube_url}</a>

Vuoi un riassunto del video o i dettagli del prodotto?
`;

      const enriched = await callGPT(
        rawText || "Video prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che aiuti a capire il valore del video.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       PREZZO PRODOTTO
    ------------------------------------------ */
    if (intent === "prezzo_prodotto") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (e) {
        console.error("Errore prezzo fuzzy:", e);
      }

      if (!product) {
        const base = `
Dimmi il nome del prodotto di cui vuoi sapere il prezzo.
`;

        const enriched = await callGPT(
          rawText || "Prezzo prodotto senza nome chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più amichevole."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "prezzo_prodotto");

      const base = `
💰 <b>${product.titolo}</b> costa <b>${product.prezzo}€</b>.

Vuoi:
• capire se è adatto a te  
• vedere i dettagli  
• andare all’acquisto  
`;

      const enriched = await callGPT(
        rawText || "Prezzo prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che spieghi perché il prezzo è giustificato.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       TRATTATIVA / SCONTO
    ------------------------------------------ */
    if (intent === "trattativa") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (e) {
        console.error("Errore trattativa fuzzy:", e);
      }

      if (!product) {
        const base = `
Vuoi uno sconto? Dimmi il nome del prodotto.
`;

        const enriched = await callGPT(
          rawText || "Sconto senza prodotto chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più simpatico."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "trattativa");

      const base = `
Capisco 😄  
Al momento non ci sono sconti attivi su <b>${product.titolo}</b>, ma posso aiutarti a capire se è davvero quello che ti serve.

Vuoi:
• una valutazione personalizzata  
• un confronto con altri prodotti  
• capire se è adatto al tuo caso  
`;

      const enriched = await callGPT(
        rawText || "Richiesta sconto prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più empatico e orientato al valore.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       OBIEZIONI SUL PREZZO
    ------------------------------------------ */
    if (intent === "obiezione") {
      let product = null;

      try {
        product = fuzzyMatchProduct(rawText || "");
        if (!product && lastProductSlug) product = findProductBySlug(lastProductSlug);
      } catch (e) {
        console.error("Errore obiezione fuzzy:", e);
      }

      if (!product) {
        const base = `
Dimmi il nome del prodotto che ti sembra caro, così ti spiego meglio cosa include.
`;

        const enriched = await callGPT(
          rawText || "Obiezione senza prodotto chiaro",
          Memory.get(uid),
          pageContext,
          "\nRendi il messaggio più rassicurante."
        );

        return reply(res, enriched || base);
      }

      try {
        state.lastProductSlug = product.slug;
      } catch {}

      setState(req, "obiezione");

      const base = `
Capisco perfettamente la tua sensazione 😌  
<b>${product.titolo}</b> non è un semplice PDF: è un percorso strutturato che ti fa risparmiare settimane di tentativi.

Vuoi che ti spieghi:
• cosa include esattamente  
• perché molte persone lo trovano utile  
• se è davvero adatto al tuo caso  
`;

      const enriched = await callGPT(
        rawText || "Obiezione prezzo prodotto " + (product.titolo || ""),
        Memory.get(uid),
        pageContext,
        "\nRendi il messaggio più rassicurante e orientato al valore.",
        { product }
      );

      return reply(res, enriched || base);
    }

    /* ------------------------------------------
       ALLEGATI
    ------------------------------------------ */
    if (intent === "allegato") {
      const filename = sub || "file";

      const base = `
Ho ricevuto il tuo file: <b>${filename}</b> 📎

Vuoi:
• che lo analizzi  
• che estragga informazioni  
• che ti dica cosa contiene  
• che lo riassuma  
`;

      const enriched = await callGPT(
        rawText || "Allegato ricevuto",
        Memory.get(uid),
        pageContext,
        "\nAggiungi una frase che inviti a spiegare cosa vuole fare con il file."
      );

      return reply(res, enriched || base);
          } /* ------------------------------------------
       FALLBACK FINALE
    ------------------------------------------ */
    const fallback = await callGPT(
      rawText || "Fallback",
      Memory.get(uid),
      pageContext,
      "\nRispondi come un assistente commerciale del sito, chiaro e utile."
    );

    return reply(res, fallback || "Dimmi pure come posso aiutarti.");

  } catch (err) {
    console.error("ERRORE HANDLE CONVERSATION:", err);

    return reply(
      res,
      "Sto avendo un problema tecnico, ma posso comunque aiutarti: dimmi cosa vuoi ottenere e ti guido."
    );
  }
}

/* ------------------------------
   EXPORT — BLINDATO
------------------------------ */
module.exports = {
  detectIntent,
  handleConversation,
  reply,
  generateUID,
  transcribeAudio,
  addEmojis
};
