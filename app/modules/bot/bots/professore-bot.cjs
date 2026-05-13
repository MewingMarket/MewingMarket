/**
 * Professore AI — Supporto + Spiegazioni tecniche
 * Path: app/modules/bot/bots/professore.bot.cjs
 */

const db = require("../../db/database.cjs");

/* =========================================================
   MATCH — quando interviene il Professore AI
========================================================= */

function match(message) {
  if (!message) return false;
  const m = message.toLowerCase();

  return (
    /* Supporto tecnico */
    m.includes("ordine") ||
    m.includes("ordini") ||
    m.includes("download") ||
    m.includes("scaricare") ||
    m.includes("non funziona") ||
    m.includes("errore") ||
    m.includes("problema") ||
    m.includes("assistenza") ||
    m.includes("rimborso") ||
    m.includes("rimborsami") ||
    m.includes("accesso") ||
    m.includes("login") ||
    m.includes("password") ||

    /* Professore / spiegazioni */
    m.includes("spiega") ||
    m.includes("come funziona") ||
    m.includes("perché") ||
    m.includes("privacy") ||
    m.includes("policy") ||
    m.includes("termini") ||
    m.includes("gdpr") ||
    m.includes("sicurezza")
  );
}

/* =========================================================
   RUN — logica principale del bot
========================================================= */

async function run(message, context = {}) {
  const m = message.toLowerCase();
  const userId = context.userId || null;

  /* =========================================================
     1) ORDINI
  ========================================================== */
  if (m.includes("ordine") || m.includes("ordini")) {
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
        download: !!o.download_url
      }))
    };
  }

  /* =========================================================
     2) DOWNLOAD
  ========================================================== */
  if (m.includes("download") || m.includes("scaricare")) {
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

  /* =========================================================
     3) RIMBORSO
  ========================================================== */
  if (m.includes("rimborso") || m.includes("rimborsami")) {
    return {
      avatar: "professor_ai",
      type: "text",
      text:
        "Per richiedere un rimborso apri un ticket dalla pagina Assistenza. " +
        "Il nostro team risponde entro 24–48 ore."
    };
  }

  /* =========================================================
     4) LOGIN / ACCESSO
  ========================================================== */
  if (m.includes("login") || m.includes("accesso") || m.includes("password")) {
    return {
      avatar: "professor_ai",
      type: "text",
      text:
        "Per accedere al tuo account vai su *Dashboard → Accedi*. " +
        "Se hai dimenticato la password puoi reimpostarla dalla stessa pagina."
    };
  }

  /* =========================================================
     5) SPIEGAZIONI TECNICHE / POLICY
  ========================================================== */
  if (m.includes("privacy") || m.includes("gdpr") || m.includes("policy")) {
    return {
      avatar: "professor_ai",
      type: "text",
      text:
        "La nostra Privacy Policy segue gli standard GDPR. " +
        "I tuoi dati vengono utilizzati solo per fornirti i servizi acquistati."
    };
  }

  if (m.includes("come funziona")) {
    return {
      avatar: "professor_ai",
      type: "text",
      text:
        "Funziona così: dopo l'acquisto ricevi subito l'accesso al tuo prodotto. " +
        "Lo trovi nella Dashboard, nella sezione *I miei download*."
    };
  }

  if (m.includes("spiega") || m.includes("perché")) {
    return {
      avatar: "professor_ai",
      type: "text",
      text:
        "Certo! Dimmi cosa vuoi che ti spieghi e ti preparo una risposta chiara e semplice."
    };
  }

  /* =========================================================
     6) FALLBACK
  ========================================================== */
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
  name: "Professore AI",
  avatar: "professor_ai",
  match,
  run
};
