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
  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";

  const email = context.email || null;
  const catalogo = context.catalogo || [];

  log("NEWSLETTER_RUN", {
    uid: context.uid,
    logged: context.userLogged,
    intent,
    email,
    catalogCount: catalogo.length
  });

  /* ============================================================
     0) GUEST MODE → onboarding + missione
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
          title: "🎯 Missione",
          text: "Accedi per iscriverti alla newsletter e sbloccare premi."
        },
        {
          title: "Cosa puoi fare ora",
          text: "• Capire cosa riceverai<br>• Vedere le novità<br>• Ricevere motivazione dall’Influencer Bot"
        }
      ]
    };
  }

  /* ============================================================
     1) ISCRIZIONE — step 1
  ============================================================= */
  if (intent === "newsletter_subscribe") {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "📬 Iscrizione newsletter",
          text: "Inserisci la tua email per completare l’iscrizione."
        },
        {
          title: "🎯 Missione",
          text: "Completa l’iscrizione per ottenere XP extra."
        }
      ]
    };
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

    try {
      await newsletter.addEmail(email);
    } catch (e) {
      return {
        avatar: "newsletter",
        type: "text",
        text: "Errore durante l’iscrizione. Riprova più tardi."
      };
    }

    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "🎉 Iscrizione completata!",
          text: `Ti ho iscritto alla newsletter con l’email <b>${email}</b>.`
        },
        {
          title: "🎯 Missione completata",
          text: "Hai completato la missione: Iscriviti alla newsletter."
        }
      ]
    };
  }

  /* ============================================================
     2) DISISCRIZIONE — step 1
  ============================================================= */
  if (intent === "newsletter_unsubscribe") {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "📭 Disiscrizione",
          text: "Inserisci la tua email per disiscriverti."
        },
        {
          title: "Nota",
          text: "Potrai sempre iscriverti di nuovo in futuro."
        }
      ]
    };
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

    try {
      await newsletter.removeEmail(email);
    } catch (e) {
      return {
        avatar: "newsletter",
        type: "text",
        text: "Errore durante la disiscrizione. Riprova più tardi."
      };
    }

    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "📭 Disiscrizione completata",
          text: `Hai rimosso l’email <b>${email}</b> dalla newsletter.`
        },
        {
          title: "🎯 Missione",
          text: "Hai completato la missione: Gestisci newsletter."
        }
      ]
    };
  }

  /* ============================================================
     3) FOLLOW-UP
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
          title: "🎯 Missione",
          text: "Iscriviti alla newsletter o guarda le novità."
        }
      ]
    };
  }

  /* ============================================================
     4) REMINDER
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
      type: "mission",
      blocks: [
        {
          title: "⏰ Promemoria impostato",
          text: "Ti invierò un promemoria tra 24 ore."
        },
        {
          title: "🎯 Missione",
          text: "Hai impostato un reminder!"
        }
      ]
    };
  }

  if (intent === "reminder_domani") {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "⏰ Promemoria impostato",
          text: "Riceverai un promemoria domani mattina."
        }
      ]
    };
  }

  if (intent === "reminder_7giorni") {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "⏰ Promemoria impostato",
          text: "Ti ricorderò tutto tra una settimana."
        }
      ]
    };
  }

  /* ============================================================
     5) NOVITÀ
  ============================================================= */
  if (intent === "novita") {
    const products = catalogo.slice(0, 3);

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
          title: "🎯 Missione",
          text: "Hai visualizzato le novità!"
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
      },
      {
        title: "🎯 Missione suggerita",
        text: "Prova a chiedere: 'Mostrami le novità'."
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
