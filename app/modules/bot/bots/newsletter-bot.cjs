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
    "newsletter_subscribe_confirm",
    "newsletter_unsubscribe_confirm",

    "follow_up",
    "novita",

    "reminder",
    "reminder_24h",
    "reminder_domani",
    "reminder_7giorni",

    "gestisci_newsletter"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}) {
  log("NEWSLETTER_RUN", {
    uid: context.uid,
    logged: context.userLogged,
    intent: context.intent?.intent,
    email: context.email || null,
    catalogCount: context.catalog?.length || 0
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const email = context.email || null;
  const catalog = context.catalog || [];

  /* ============================================================
     0) GUEST MODE → onboarding + motivazione registrazione
  ============================================================= */
  if (!context.userLogged) {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "📬 Modalità DEMO",
          text: "Sono il Newsletter Bot. Posso mostrarti come funziona la newsletter."
        },
        {
          title: "Cosa puoi fare ora",
          text: "• Capire cosa riceverai<br>• Vedere le novità<br>• Ricevere motivazione dall’Influencer Bot"
        },
        {
          title: "Per iscriverti",
          text: "Accedi o crea un account."
        }
      ]
    };
  }

  /* ============================================================
     1) ISCRIZIONE — step 1
  ============================================================= */
  if (intent === "newsletter_subscribe") {
    return newsletter.newsletterSubscribe();
  }

  /* ============================================================
     1b) ISCRIZIONE — step 2 (con email)
  ============================================================= */
  if (intent === "newsletter_subscribe_confirm") {
    if (!email) {
      return {
        avatar: "newsletter",
        type: "text",
        text: "Per iscriverti alla newsletter ho bisogno della tua email."
      };
    }

    await newsletter.addEmail(email);

    return newsletter.newsletterSubscribeConfirm(email);
  }

  /* ============================================================
     2) DISISCRIZIONE — step 1
  ============================================================= */
  if (intent === "newsletter_unsubscribe") {
    return newsletter.newsletterUnsubscribe();
  }

  /* ============================================================
     2b) DISISCRIZIONE — step 2 (con email)
  ============================================================= */
  if (intent === "newsletter_unsubscribe_confirm") {
    if (!email) {
      return {
        avatar: "newsletter",
        type: "text",
        text: "Per disiscriverti dalla newsletter ho bisogno della tua email."
      };
    }

    await newsletter.removeEmail(email);

    return newsletter.newsletterUnsubscribeConfirm(email);
  }

  /* ============================================================
     3) FOLLOW-UP (retention + motivazione utenti)
     — come nelle tue foto Notion
  ============================================================= */
  if (intent === "follow_up") {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "📬 Follow-up",
          text: "Vuoi rimanere aggiornato su guide, novità e contenuti utili?"
        },
        {
          title: "Cosa posso fare per te",
          text: "• Iscriverti alla newsletter<br>• Mostrarti le ultime novità<br>• Farti motivare dall’Influencer Bot"
        }
      ]
    };
  }

  /* ============================================================
     4) REMINDER (solo spiegazione)
  ============================================================= */
  if (intent === "reminder") {
    return {
      avatar: "newsletter",
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
      avatar: "newsletter",
      type: "text",
      text: "Perfetto! Ti invierò un promemoria tra 24 ore."
    };
  }

  if (intent === "reminder_domani") {
    return {
      avatar: "newsletter",
      type: "text",
      text: "Riceverai un promemoria domani mattina."
    };
  }

  if (intent === "reminder_7giorni") {
    return {
      avatar: "newsletter",
      type: "text",
      text: "Ti ricorderò tutto tra una settimana."
    };
  }

  /* ============================================================
     5) NOVITÀ (solo 3 prodotti)
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
      type: "mission",
      blocks: [
        {
          title: "🆕 Ultime novità",
          text: products
            .map(p => `• <b>${p.titolo_breve}</b>: ${p.descrizione_breve}`)
            .join("<br>")
        },
        {
          title: "Vuoi vedere tutto il catalogo?",
          cta: {
            label: "Apri catalogo",
            href: "/catalogo"
          }
        }
      ]
    };
  }

  /* ============================================================
     6) FALLBACK
  ============================================================= */
  return {
    avatar: "newsletter",
    type: "mission",
    blocks: [
      {
        title: "📬 Gestione Newsletter",
        text: "Vuoi iscriverti, disiscriverti o vedere le novità?"
      }
    ]
  };
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
