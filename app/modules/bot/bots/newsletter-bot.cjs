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
    catalogCount: context.catalog?.length || 0
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const catalog = context.catalog || [];

  /* ============================================================
     0) GUEST MODE → SOLO SPIEGAZIONE
  ============================================================= */
  if (!context.userLogged) {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "📬 Modalità DEMO",
          text: "Posso mostrarti come funziona la newsletter, ma per iscriverti devi accedere."
        },
        {
          title: "Cosa puoi fare ora",
          text: "• Vedere come funziona l’iscrizione<br>• Capire cosa riceverai"
        },
        {
          title: "Sblocca tutte le funzioni",
          text: "Accedi al sito per iscriverti o gestire la tua newsletter."
        }
      ]
    };
  }

  /* ============================================================
     1) ISCRIZIONE (link reale)
  ============================================================= */
  if (intent === "newsletter_subscribe") {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "📬 Iscriviti alla Newsletter",
          text: "Riceverai guide, aggiornamenti e contenuti esclusivi."
        },
        {
          title: "Procedi all’iscrizione",
          cta: {
            label: "Vai alla pagina di iscrizione",
            href: "/iscrizione.html"
          }
        }
      ]
    };
  }

  /* ============================================================
     2) DISISCRIZIONE (link reale)
  ============================================================= */
  if (intent === "newsletter_unsubscribe") {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "❌ Disiscriviti dalla Newsletter",
          text: "Se vuoi interrompere le comunicazioni, puoi farlo qui."
        },
        {
          title: "Procedi alla disiscrizione",
          cta: {
            label: "Vai alla pagina di disiscrizione",
            href: "/disiscriviti.html"
          }
        }
      ]
    };
  }

  /* ============================================================
     3) FOLLOW-UP (retention)
  ============================================================= */
  if (intent === "follow_up") {
    return {
      avatar: "newsletter",
      type: "mission",
      blocks: [
        {
          title: "Grazie per essere passato!",
          text: "Vuoi rimanere aggiornato su novità, guide e contenuti utili?"
        },
        {
          title: "Cosa vuoi fare?",
          text: "• Iscriverti<br>• Vedere le novità"
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
      type: "mission",
      blocks: [
        {
          title: "⏰ Impostare un promemoria",
          text: "Scegli quando vuoi essere ricordato."
        },
        {
          title: "Opzioni",
          text: "• Tra 24 ore<br>• Domani mattina<br>• Tra una settimana"
        }
      ]
    };
  }

  if (intent === "reminder_24h") {
    return {
      avatar: "newsletter",
      type: "text",
      text: "Per impostare un promemoria tra 24 ore usa il calendario del tuo dispositivo."
    };
  }

  if (intent === "reminder_domani") {
    return {
      avatar: "newsletter",
      type: "text",
      text: "Per un promemoria domani mattina usa l’app Promemoria o Calendario."
    };
  }

  if (intent === "reminder_7giorni") {
    return {
      avatar: "newsletter",
      type: "text",
      text: "Per un promemoria tra una settimana puoi usare qualsiasi app di task."
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
