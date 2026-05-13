/**
 * Newsletter AI — Follow-up, onboarding, retention
 * Path: app/modules/bot/bots/newsletter-bot.cjs
 */

const db = require("../../db/database.cjs");

/* =========================================================
   MATCH — quando interviene Newsletter AI
========================================================= */

function match(message) {
  if (!message) return false;
  const m = message.toLowerCase();

  return (
    m.includes("newsletter") ||
    m.includes("email") ||
    m.includes("aggiornami") ||
    m.includes("mandami un") ||
    m.includes("inviami") ||
    m.includes("follow up") ||
    m.includes("follow-up") ||
    m.includes("post acquisto") ||
    m.includes("post-acquisto") ||
    m.includes("novità") ||
    m.includes("nuovi prodotti") ||
    m.includes("nuove uscite") ||
    m.includes("reminder") ||
    m.includes("ricordamelo")
  );
}

/* =========================================================
   RUN — logica principale del bot
========================================================= */

async function run(message, context = {}) {
  const m = message.toLowerCase();
  const userEmail = context.email || null;
  const userId = context.userId || null;

  /* =========================================================
     1) RICHIESTA DI ISCRIZIONE ALLA NEWSLETTER
  ========================================================== */
  if (m.includes("newsletter") || m.includes("iscrivimi")) {
    if (!userEmail) {
      return {
        avatar: "newsletter_ai",
        type: "text",
        text: "Per iscriverti alla newsletter ho bisogno della tua email."
      };
    }

    // Salvataggio email (se non esiste già)
    await db.run(
      "INSERT OR IGNORE INTO newsletter (email, created_at) VALUES (?, datetime('now'))",
      [userEmail]
    );

    return {
      avatar: "newsletter_ai",
      type: "text",
      text: `Perfetto! Ti ho iscritto alla newsletter. Riceverai aggiornamenti sulle nuove uscite e contenuti esclusivi.`
    };
  }

  /* =========================================================
     2) FOLLOW-UP POST ACQUISTO
  ========================================================== */
  if (m.includes("post acquisto") || m.includes("post-acquisto") || m.includes("follow up")) {
    if (!userId) {
      return {
        avatar: "newsletter_ai",
        type: "text",
        text: "Per inviarti un follow-up personalizzato devi prima accedere al tuo account."
      };
    }

    const lastOrder = await db.get(
      "SELECT * FROM ordini WHERE utente_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (!lastOrder) {
      return {
        avatar: "newsletter_ai",
        type: "text",
        text: "Non trovo ordini recenti. Vuoi vedere i prodotti disponibili?"
      };
    }

    return {
      avatar: "newsletter_ai",
      type: "text",
      text:
        `Grazie per il tuo acquisto di *${lastOrder.titolo}*! ` +
        `Se hai bisogno di aiuto o vuoi consigli su come usarlo al meglio, sono qui per te.`,
      actions: [
        { label: "Mostra download", value: "download" },
        { label: "Consigli rapidi", value: "consiglio veloce" }
      ]
    };
  }

  /* =========================================================
     3) REMINDER / RICORDAMI
  ========================================================== */
  if (m.includes("ricordamelo") || m.includes("reminder")) {
    return {
      avatar: "newsletter_ai",
      type: "quick_replies",
      text: "Quando vuoi che ti ricordi?",
      options: [
        { label: "Tra 24 ore", value: "reminder 24h" },
        { label: "Domani mattina", value: "reminder domani" },
        { label: "Tra una settimana", value: "reminder 7 giorni" }
      ]
    };
  }

  if (m.includes("reminder 24h")) {
    return {
      avatar: "newsletter_ai",
      type: "text",
      text: "Perfetto! Ti invierò un promemoria tra 24 ore."
    };
  }

  if (m.includes("reminder domani")) {
    return {
      avatar: "newsletter_ai",
      type: "text",
      text: "Riceverai un promemoria domani mattina."
    };
  }

  if (m.includes("reminder 7 giorni")) {
    return {
      avatar: "newsletter_ai",
      type: "text",
      text: "Ti ricorderò tutto tra una settimana."
    };
  }

  /* =========================================================
     4) NOVITÀ / NUOVE USCITE
  ========================================================== */
  if (m.includes("novità") || m.includes("nuovi prodotti") || m.includes("nuove uscite")) {
    const products = await db.all(
      "SELECT * FROM prodotti ORDER BY created_at DESC LIMIT 3"
    );

    return {
      avatar: "newsletter_ai",
      type: "card",
      layout: "products_list",
      title: "Ultime novità",
      products: products.map(p => ({
        id: p.id,
        title: p.nome,
        price_cent: p.prezzo_cent
      })),
      actions: [
        { label: "Mostra tutto", value: "mostra prodotti" },
        { label: "Iscrivimi alla newsletter", value: "iscrivimi newsletter" }
      ]
    };
  }

  /* =========================================================
     5) FALLBACK
  ========================================================== */
  return {
    avatar: "newsletter_ai",
    type: "quick_replies",
    text: "Vuoi aggiornamenti, reminder o un follow-up?",
    options: [
      { label: "Iscrivimi alla newsletter", value: "iscrivimi newsletter" },
      { label: "Follow-up post acquisto", value: "follow up" },
      { label: "Mostra novità", value: "novità" }
    ]
  };
}

module.exports = {
  name: "Newsletter AI",
  avatar: "newsletter_ai",
  match,
  run
};
