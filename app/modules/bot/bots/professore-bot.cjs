/**
 * Professore AI — Supporto + Spiegazioni tecniche (2027)
 * Path: app/modules/bot/bots/professore-bot.cjs
 */

const path = require("path");
const db = require("../../db/database.cjs");

const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const support = require(path.join(process.cwd(), "app/modules/bot/handlers/support.cjs"));
const legal = require(path.join(process.cwd(), "app/modules/bot/handlers/legal.cjs"));

/* ============================================================
   MATCH — basato su INTENT, non sul testo
============================================================ */
function match(intent) {
  return [
    "supporto",
    "ordini",
    "download",
    "pagamento",
    "rimborso",
    "contatti",
    "login",
    "registrazione",
    "password_reset",
    "privacy",
    "termini",
    "cookie",
    "spiega",
    "come_funziona"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale del bot
============================================================ */
async function run(message, context = {}) {
  log("PROFESSORE_RUN", context);

  const intent = context.intent;
  const userId = context.userId || null;

  /* ============================================================
     1) ORDINI
  ============================================================ */
  if (intent === "ordini") {
    if (!userId) {
      return {
        avatar: "professor_ai",
        type: "text",
        text: "Per mostrarti i tuoi ordini devi prima accedere al tuo account."
      };
    }

    const orders = await db.all(
      "SELECT * FROM ordini WHERE utente_id = ? ORDER BY created_at DESC",
      [userId]
    );

    if (!orders.length) {
      return {
        avatar: "professor_ai",
        type: "text",
        text: "Non risultano ordini associati al tuo account."
      };
    }

    return {
      avatar: "professor_ai",
      type: "orders_overview",
      orders: orders.map(o => ({
        id: o.id,
        title: o.titolo,
        downloadable: !!o.download_url
      }))
    };
  }

  /* ============================================================
     2) DOWNLOAD
  ============================================================ */
  if (intent === "download") {
    if (!userId) {
      return {
        avatar: "professor_ai",
        type: "text",
        text: "Per accedere ai tuoi download devi prima effettuare il login."
      };
    }

    const downloads = await db.all(
      "SELECT * FROM ordini WHERE utente_id = ? AND download_url IS NOT NULL",
      [userId]
    );

    if (!downloads.length) {
      return {
        avatar: "professor_ai",
        type: "text",
        text: "Non hai ancora prodotti scaricabili."
      };
    }

    return {
      avatar: "professor_ai",
      type: "downloads_list",
      downloads: downloads.map(d => ({
        id: d.id,
        title: d.titolo,
        url: d.download_url
      }))
    };
  }

  /* ============================================================
     3) SUPPORTO STANDARD (usa Support Helper)
  ============================================================ */
  if (intent === "login")          return support.supportLogin();
  if (intent === "registrazione")  return support.supportRegistrazione();
  if (intent === "password_reset") return support.supportPasswordReset();
  if (intent === "pagamento")      return support.supportPagamento();
  if (intent === "rimborso")       return support.supportRimborso();
  if (intent === "contatti")       return support.supportContatti();
  if (intent === "supporto")       return support.supportGeneric();

  /* ============================================================
     4) POLICY / LEGAL (usa Legal Helper)
  ============================================================ */
  if (intent === "privacy") return legal.legalPrivacy();
  if (intent === "termini") return legal.legalTerms();
  if (intent === "cookie")  return legal.legalCookie();

  /* ============================================================
     5) SPIEGAZIONI TECNICHE
  ============================================================ */
  if (intent === "come_funziona") {
    return {
      avatar: "professor_ai",
      type: "text",
      text:
        "Funziona così: dopo l'acquisto ricevi subito l’accesso al tuo prodotto. " +
        "Lo trovi nella Dashboard, nella sezione *I miei download*."
    };
  }

  if (intent === "spiega") {
    return {
      avatar: "professor_ai",
      type: "text",
      text: "Certo! Dimmi cosa vuoi che ti spieghi e preparo una risposta chiara e semplice."
    };
  }

  /* ============================================================
     6) FALLBACK
  ============================================================ */
  return {
    avatar: "professor_ai",
    type: "quick_replies",
    text: "Come posso aiutarti?",
    options: [
      { label: "Vedi i miei ordini", value: "ordini" },
      { label: "Mostra download", value: "download" },
      { label: "Spiegami qualcosa", value: "spiega" }
    ]
  };
}

module.exports = {
  name: "professore",
  avatar: "professor_ai",
  match,
  run
};
