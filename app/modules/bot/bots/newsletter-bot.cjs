/**
 * Newsletter AI — NPC informativo / onboarding / retention (2027)
 * Path: app/modules/bot/bots/newsletter-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const newsletter = require(path.join(process.cwd(), "app/modules/bot/handlers/newsletter.cjs"));

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "newsletter",
    "newsletter_subscribe",
    "newsletter_unsubscribe",
    "follow_up",
    "novita",
    "reminder",
    "reminder_24h",
    "reminder_domani",
    "reminder_7giorni"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}) {
  log("NEWSLETTER_RUN", {
    uid: context.uid,
    intent: context.intent?.intent,
    catalogCount: context.catalog?.length || 0
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const catalog = context.catalog || [];

  /* ============================================================
     1) ISCRIZIONE (spiegazione, non azione)
  ============================================================= */
  if (intent === "newsletter_subscribe") {
    return newsletter.newsletterSubscribe();
  }

  /* ============================================================
     2) DISISCRIZIONE (spiegazione, non azione)
  ============================================================= */
  if (intent === "newsletter_unsubscribe") {
    return newsletter.newsletterUnsubscribe();
  }

  /* ============================================================
     3) FOLLOW-UP (NPC → retention)
  ============================================================= */
  if (intent === "follow_up") {
    return {
      avatar: "newsletter",
      type: "text",
      text:
        "Grazie per essere passato! Se vuoi rimanere aggiornato su novità, guide e contenuti utili, posso mostrarti come iscriverti alla newsletter.",
      actions: [
        { label: "Come iscrivermi", intent: "newsletter_subscribe" },
        { label: "Novità", intent: "novita" }
      ]
    };
  }

  /* ============================================================
     4) REMINDER (NPC → spiega, non crea)
  ============================================================= */
  if (intent === "reminder") {
    return {
      avatar: "newsletter",
      type: "quick_replies",
      text: "Vuoi sapere come impostare un promemoria?",
      options: [
        { label: "Tra 24 ore", intent: "reminder_24h" },
        { label: "Domani mattina", intent: "reminder_domani" },
        { label: "Tra una settimana", intent: "reminder_7giorni" }
      ]
    };
  }

  if (intent === "reminder_24h") {
    return {
      avatar: "newsletter",
      type: "text",
      text: "Per impostare un promemoria tra 24 ore puoi usare il calendario del tuo dispositivo."
    };
  }

  if (intent === "reminder_domani") {
    return {
      avatar: "newsletter",
      type: "text",
      text: "Per impostare un promemoria domani mattina usa l’app Promemoria o Calendario."
    };
  }

  if (intent === "reminder_7giorni") {
    return {
      avatar: "newsletter",
      type: "text",
      text: "Per un promemoria tra una settimana puoi usare qualsiasi app di task o calendario."
    };
  }

  /* ============================================================
     5) NOVITÀ (mock locale, niente DB)
  ============================================================= */
  if (intent === "novita") {
    const products = catalog.slice(0, 3);

    if (!products.length) {
      return {
        avatar: "newsletter",
        type: "text",
        text: "Al momento non ci sono novità disponibili."
      };
    }

    return {
      avatar: "newsletter",
      type: "carousel",
      title: "Ultime novità",
      items: products.map(p => ({
        id: p.id,
        title: p.titolo_breve,
        description: p.descrizione_breve,
        price_cent: p.prezzo_cent,
        image: p.immagine_url
      })),
      actions: [
        { label: "Mostra tutto", intent: "catalogo" },
        { label: "Come iscrivermi", intent: "newsletter_subscribe" }
      ]
    };
  }

  /* ============================================================
     6) FALLBACK
  ============================================================= */
  return newsletter.newsletterGeneric();
}

/* ============================================================
   EXPORT NPC
============================================================ */
module.exports = {
  name: "newsletter",
  avatar: "newsletter",
  match,
  run
};
