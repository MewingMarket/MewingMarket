/**
 * modules/bot/intent.cjs
 * DETECT INTENT — versione modulare, pulita, con logging totale
 */

const { log } = require("./utils.cjs");
const path = require("path");
const { normalize, cleanSearchQuery } = require(path.join(__dirname, "..", "utils.cjs"));
const { fuzzyMatchProduct } = require(path.join(__dirname, "..", "catalogo.cjs"));

/* ============================================================
   DETECT INTENT — funzione principale
============================================================ */
function detectIntent(rawText) {
  log("INTENT_RAW_TEXT", rawText);

  try {
    const text = rawText || "";
    const t = normalize(text);
    const q = cleanSearchQuery(text);

    log("INTENT_NORMALIZED", { t, q });

    // Conversazione generale
    if (
      q.includes("ciao") ||
      q.includes("hey") ||
      q.includes("come va") ||
      q.includes("come stai") ||
      q.includes("tutto bene") ||
      q.includes("parlami") ||
      q.includes("dimmi qualcosa")
    ) {
      return { intent: "conversazione", sub: null };
    }

    // Menu
    if (
      q.includes("menu") ||
      q.includes("inizio") ||
      q.includes("start") ||
      q.includes("opzioni") ||
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
    if (q.includes("disiscriv")) {
      return { intent: "newsletter", sub: "unsubscribe" };
    }
    if (q.includes("newsletter") || q.includes("iscrizione")) {
      return { intent: "newsletter", sub: "subscribe" };
    }

    // Social specifici
    if (q.includes("instagram")) return { intent: "social_specifico", sub: "instagram" };
    if (q.includes("tiktok")) return { intent: "social_specifico", sub: "tiktok" };
    if (q.includes("youtube")) return { intent: "social_specifico", sub: "youtube" };
    if (q.includes("facebook")) return { intent: "social_specifico", sub: "facebook" };
    if (q.includes("threads")) return { intent: "social_specifico", sub: "threads" };
    if (q.includes("linkedin")) return { intent: "social_specifico", sub: "linkedin" };
    if (q === "x" || q.includes(" x ")) return { intent: "social_specifico", sub: "x" };

    // Social generico
    if (q.includes("social")) return { intent: "social", sub: null };

    // Privacy / Termini / Cookie
    if (q.includes("privacy")) return { intent: "privacy", sub: null };
    if (q.includes("termini") || q.includes("condizioni")) return { intent: "termini", sub: null };
    if (q.includes("cookie")) return { intent: "cookie", sub: null };

    // Resi
    if (q.includes("resi") || q.includes("rimborso")) return { intent: "resi", sub: null };

    // FAQ
    if (q.includes("faq")) return { intent: "faq", sub: null };

    // Contatti
    if (
      q.includes("contatti") ||
      q.includes("contatto") ||
      q.includes("email") ||
      q.includes("whatsapp") ||
      q.includes("telefono")
    ) {
      return { intent: "contatti", sub: null };
    }

    // Dove siamo
    if (q.includes("dove siamo") || q.includes("indirizzo") || q.includes("sede")) {
      return { intent: "dovesiamo", sub: null };
    }

    // Supporto
    if (q.includes("supporto") || q.includes("assistenza") || q.includes("problema")) {
      if (q.includes("download")) return { intent: "supporto", sub: "download" };
      if (q.includes("payhip")) return { intent: "supporto", sub: "payhip" };
      if (q.includes("rimborso")) return { intent: "supporto", sub: "rimborso" };
      if (q.includes("contatto") || q.includes("email")) return { intent: "supporto", sub: "contatto" };
      return { intent: "supporto", sub: null };
    }

    // Acquisto diretto
    if (
      q.includes("acquisto") ||
      q.includes("compra") ||
      q.includes("prendo") ||
      q.includes("lo compro")
    ) {
      return { intent: "acquisto_diretto", sub: null };
    }

    // Dettagli prodotto
    if (
      q.includes("dettagli") ||
      q.includes("approfondisci") ||
      q.includes("informazioni")
    ) {
      return { intent: "dettagli_prodotto", sub: null };
    }

    // Video prodotto
    if (q.includes("video")) return { intent: "video_prodotto", sub: null };

    // Prezzo prodotto
    if (q.includes("prezzo") || q.includes("quanto costa")) {
      return { intent: "prezzo_prodotto", sub: null };
    }

    // Trattativa
    if (q.includes("sconto") || q.includes("promo")) {
      return { intent: "trattativa", sub: null };
    }

    // Obiezione
    if (q.includes("caro") || q.includes("vale la pena")) {
      return { intent: "obiezione", sub: null };
    }

    // Allegati
    if (rawText && rawText.startsWith("FILE:")) {
      return { intent: "allegato", sub: rawText.replace("FILE:", "").trim() };
    }

    // Match prodotto fuzzy
    const product = fuzzyMatchProduct(text);
    if (product) return { intent: "prodotto", sub: product.slug };

    // Fallback GPT
    return { intent: "gpt", sub: null };

  } catch (err) {
    log("INTENT_FATAL_ERROR", err);
    return { intent: "gpt", sub: null };
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = detectIntent;
