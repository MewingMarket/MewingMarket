/**
 * Newsletter AI — Follow-up, onboarding, retention (2027)
 * Path: app/modules/bot/bots/newsletter-bot.cjs
 */

const path = require("path");
const db = require("../../db/database.cjs");

const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const newsletter = require(path.join(process.cwd(), "app/modules/bot/handlers/newsletter.cjs"));

/* ============================================================
   MATCH — basato su INTENT, non sul testo
============================================================ */
function match(intent) {
  return [
    "newsletter",
    "newsletter_subscribe",
    "newsletter_unsubscribe",
    "newsletter_subscribe_confirm",
    "newsletter_unsubscribe_confirm",
    "follow_up",
    "novita",
    "reminder",
    "reminder_24h",
    "reminder_domani",
    "reminder_7giorni"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale del bot
============================================================ */
async function run(message, context = {}) {
  log("NEWSLETTER_RUN", context);

  const intent = context.intent;
  const email = context.email || null;
  const userId = context.userId || null;

  /* ============================================================
     1) ISCRIZIONE NEWSLETTER
  ============================================================ */
  if (intent === "newsletter_subscribe") {
    return newsletter.newsletterSubscribe();
  }

  if (intent === "newsletter_subscribe_confirm") {
    if (!email) {
      return {
        avatar: "newsletter_ai",
        type: "text",
        text: "Per iscriverti alla newsletter ho bisogno della tua email."
      };
    }

    await db.run(
      "INSERT OR IGNORE INTO newsletter (email, created_at) VALUES (?, datetime('now'))",
      [email]
    );

    return newsletter.newsletterSubscribeConfirm(email);
  }

  /* ============================================================
     2) DISISCRIZIONE NEWSLETTER
  ============================================================ */
  if (intent === "newsletter_unsubscribe") {
    return newsletter.newsletterUnsubscribe();
  }

  if (intent === "newsletter_unsubscribe_confirm") {
    if (!email) {
      return {
        avatar: "newsletter_ai",
        type: "text",
        text: "Per disiscriverti dalla newsletter ho bisogno della tua email."
      };
    }

    await db.run("DELETE FROM newsletter WHERE email = ?", [email]);

    return newsletter.newsletterUnsubscribeConfirm(email);
  }

  /* ============================================================
     3) FOLLOW-UP POST ACQUISTO
  ============================================================ */
  if (intent === "follow_up") {
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
        { label: "Consigli rapidi", value: "consiglio_rapido" }
      ]
    };
  }

  /* ============================================================
     4) REMINDER
  ============================================================ */
  if (intent === "reminder") {
    return {
      avatar: "newsletter_ai",
      type: "quick_replies",
      text: "Quando vuoi che ti ricordi?",
      options: [
        { label: "Tra 24 ore", value: "reminder_24h" },
        { label: "Domani mattina", value: "reminder_domani" },
        { label: "Tra una settimana", value: "reminder_7giorni" }
      ]
    };
  }

  if (intent === "reminder_24h") {
    return {
      avatar: "newsletter_ai",
      type: "text",
      text: "Perfetto! Ti invierò un promemoria tra 24 ore."
    };
  }

  if (intent === "reminder_domani") {
    return {
      avatar: "newsletter_ai",
      type: "text",
      text: "Riceverai un promemoria domani mattina."
    };
  }

  if (intent === "reminder_7giorni") {
    return {
      avatar: "newsletter_ai",
      type: "text",
      text: "Ti ricorderò tutto tra una settimana."
    };
  }

  /* ============================================================
     5) NOVITÀ / NUOVE USCITE
  ============================================================ */
  if (intent === "novita") {
    const products = await db.all(
      "SELECT * FROM prodotti ORDER BY created_at DESC LIMIT 3"
    );

    return {
      avatar: "newsletter_ai",
      type: "products_list",
      title: "Ultime novità",
      products: products.map(p => ({
        id: p.id,
        title: p.nome,
        price_cent: p.prezzo_cent
      })),
      actions: [
        { label: "Mostra tutto", value: "catalogo" },
        { label: "Iscrivimi alla newsletter", value: "newsletter_subscribe" }
      ]
    };
  }

  /* ============================================================
     6) FALLBACK
  ============================================================ */
  return newsletter.newsletterGeneric();
}

module.exports = {
  name: "newsletter",
  avatar: "newsletter_ai",
  match,
  run
};
