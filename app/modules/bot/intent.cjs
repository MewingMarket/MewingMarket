/**
 * modules/bot/intent.cjs
 * DETECT INTENT — versione estesa con GUIDE, ACCOUNT, ORDINI, DOWNLOAD, PAYPAL
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

    /* ============================================================
       CONVERSAZIONE GENERALE
    ============================================================ */
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

    /* ============================================================
       MENU
    ============================================================ */
    if (
      q.includes("menu") ||
      q.includes("inizio") ||
      q.includes("start") ||
      q.includes("opzioni") ||
      q.includes("aiuto")
    ) {
      return { intent: "menu", sub: null };
    }

    /* ============================================================
       GUIDE / TUTORIAL / ISTRUZIONI
    ============================================================ */
    if (
      q.includes("guida") ||
      q.includes("guide") ||
      q.includes("tutorial") ||
      q.includes("istruzioni") ||
      q.includes("come fare") ||
      q.includes("come si fa") ||
      q.includes("non riesco") ||
      q.includes("problema con") ||
      q.includes("spiegami") ||
      q.includes("passo passo")
    ) {
      return { intent: "guida", sub: q };
    }

    /* ============================================================
       REGISTRAZIONE / LOGIN / ACCOUNT
    ============================================================ */
    if (
      q.includes("registrazione") ||
      q.includes("registrarmi") ||
      q.includes("creare account") ||
      q.includes("nuovo account")
    ) {
      return { intent: "registrazione", sub: null };
    }

    if (
      q.includes("login") ||
      q.includes("accedere") ||
      q.includes("entra") ||
      q.includes("accesso")
    ) {
      return { intent: "login", sub: null };
    }

    if (
      q.includes("password dimenticata") ||
      q.includes("reset password") ||
      q.includes("recuperare password")
    ) {
      return { intent: "password_reset", sub: null };
    }

    if (
      q.includes("account") ||
      q.includes("dashboard") ||
      q.includes("profilo")
    ) {
      return { intent: "account", sub: null };
    }

    /* ============================================================
       ORDINI / DOWNLOAD
    ============================================================ */
    if (
      q.includes("ordini") ||
      q.includes("miei ordini") ||
      q.includes("ordine")
    ) {
      return { intent: "ordini", sub: null };
    }

    if (
      q.includes("download") ||
      q.includes("scaricare") ||
      q.includes("non riesco a scaricare")
    ) {
      return { intent: "download", sub: null };
    }

    /* ============================================================
       CATALOGO
    ============================================================ */
    if (
      q.includes("catalogo") ||
      q.includes("prodotti") ||
      q.includes("store") ||
      q.includes("shop")
    ) {
      return { intent: "catalogo", sub: null };
    }

    /* ============================================================
       NEWSLETTER (migliorata)
    ============================================================ */
    if (q.includes("disiscriv") || q.includes("cancellami") || q.includes("non voglio più")) {
      return { intent: "newsletter", sub: "unsubscribe" };
    }

    if (
      q.includes("newsletter") ||
      q.includes("iscrizione") ||
      q.includes("iscrivimi") ||
      q.includes("voglio ricevere")
    ) {
      return { intent: "newsletter", sub: "subscribe" };
    }

    /* ============================================================
       SOCIAL
    ============================================================ */
    if (q.includes("instagram")) return { intent: "social_specifico", sub: "instagram" };
    if (q.includes("tiktok")) return { intent: "social_specifico", sub: "tiktok" };
    if (q.includes("youtube")) return { intent: "social_specifico", sub: "youtube" };
    if (q.includes("facebook")) return { intent: "social_specifico", sub: "facebook" };
    if (q.includes("threads")) return { intent: "social_specifico", sub: "threads" };
    if (q.includes("linkedin")) return { intent: "social_specifico", sub: "linkedin" };
    if (q === "x" || q.includes(" x ")) return { intent: "social_specifico", sub: "x" };

    if (q.includes("social")) return { intent: "social", sub: null };

    /* ============================================================
       LEGAL
    ============================================================ */
    if (q.includes("privacy")) return { intent: "privacy", sub: null };
    if (q.includes("termini") || q.includes("condizioni")) return { intent: "termini", sub: null };
    if (q.includes("cookie")) return { intent: "cookie", sub: null };

    /* ============================================================
       RESI
    ============================================================ */
    if (q.includes("resi") || q.includes("rimborso")) return { intent: "resi", sub: null };

    /* ============================================================
       FAQ
    ============================================================ */
    if (q.includes("faq")) return { intent: "faq", sub: null };

    /* ============================================================
       CONTATTI
    ============================================================ */
    if (
      q.includes("contatti") ||
      q.includes("contatto") ||
      q.includes("email") ||
      q.includes("whatsapp") ||
      q.includes("telefono")
    ) {
      return { intent: "contatti", sub: null };
    }

    /* ============================================================
       DOVE SIAMO
    ============================================================ */
    if (q.includes("dove siamo") || q.includes("indirizzo") || q.includes("sede")) {
      return { intent: "dovesiamo", sub: null };
    }

    /* ============================================================
       SUPPORTO
    ============================================================ */
    if (q.includes("supporto") || q.includes("assistenza") || q.includes("problema")) {
      if (q.includes("download")) return { intent: "supporto", sub: "download" };
      if (q.includes("payhip")) return { intent: "supporto", sub: "payhip" };
      if (q.includes("rimborso")) return { intent: "supporto", sub: "rimborso" };
      if (q.includes("contatto") || q.includes("email")) return { intent: "supporto", sub: "contatto" };
      return { intent: "supporto", sub: null };
    }

    /* ============================================================
       PAGAMENTI / PAYPAL
    ============================================================ */
    if (
      q.includes("pagamento") ||
      q.includes("paypal") ||
      q.includes("checkout") ||
      q.includes("ricevuta") ||
      q.includes("transazione")
    ) {
      return { intent: "pagamento", sub: null };
    }

    /* ============================================================
       ACQUISTO DIRETTO
    ============================================================ */
    if (
      q.includes("acquisto") ||
      q.includes("compra") ||
      q.includes("prendo") ||
      q.includes("lo compro")
    ) {
      return { intent: "acquisto_diretto", sub: null };
    }

    /* ============================================================
       DETTAGLI PRODOTTO
    ============================================================ */
    if (
      q.includes("dettagli") ||
      q.includes("approfondisci") ||
      q.includes("informazioni")
    ) {
      return { intent: "dettagli_prodotto", sub: null };
    }

    /* ============================================================
       VIDEO PRODOTTO
    ============================================================ */
    if (q.includes("video")) return { intent: "video_prodotto", sub: null };

    /* ============================================================
       PREZZO PRODOTTO
    ============================================================ */
    if (q.includes("prezzo") || q.includes("quanto costa")) {
      return { intent: "prezzo_prodotto", sub: null };
    }

    /* ============================================================
       TRATTATIVA
    ============================================================ */
    if (q.includes("sconto") || q.includes("promo")) {
      return { intent: "trattativa", sub: null };
    }

    /* ============================================================
       OBIEZIONE
    ============================================================ */
    if (q.includes("caro") || q.includes("vale la pena")) {
      return { intent: "obiezione", sub: null };
    }

    /* ============================================================
       ALLEGATI
    ============================================================ */
    if (rawText && rawText.startsWith("FILE:")) {
      return { intent: "allegato", sub: rawText.replace("FILE:", "").trim() };
    }

    /* ============================================================
       MATCH PRODOTTO FUZZY
    ============================================================ */
    const product = fuzzyMatchProduct(text);
    if (product) return { intent: "prodotto", sub: product.slug };

    /* ============================================================
       FALLBACK GPT
    ============================================================ */
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
