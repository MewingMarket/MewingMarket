/**
 * Avatar Generico — Narratore / Onboarding / Fallback (2027)
 * Path: app/modules/bot/bots/generic-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers UI
const conv = require(path.join(process.cwd(), "app/modules/bot/handlers/conversation.cjs"));
const fb = require(path.join(process.cwd(), "app/modules/bot/handlers/fallback.cjs"));

/* ============================================================
   MATCH — il bot generico risponde SEMPRE come fallback
============================================================ */
function match() {
  return true;
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}, extras = {}) {
  log("GENERIC_RUN", {
    uid: context.uid,
    intent: context.intent?.intent,
    memory: context.memory?.length || 0
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";

  /* ============================================================
     0) GUEST MODE — onboarding migliorato + missione iniziale
  ============================================================= */
  if (!context.userLogged && intent === "saluto") {
    return {
      avatar: "assistant",
      type: "mission",
      blocks: [
        {
          title: "👋 Benvenuto!",
          text: "Io sono il Narratore. Ti guiderò nel videogioco conversazionale."
        },
        {
          title: "🎯 Missione iniziale",
          text: "Scegli un bot dalla Home per iniziare la tua avventura."
        },
        {
          title: "Suggerimento",
          text: "Ogni bot ha una personalità diversa. Provali tutti!"
        }
      ]
    };
  }

  /* ============================================================
     1) SALUTI / ONBOARDING
     (missione: 'parla con un NPC')
  ============================================================= */
  if (intent === "saluto" || intent === "onboarding") {
    return {
      avatar: "assistant",
      type: "mission",
      blocks: [
        {
          title: "👋 Ciao!",
          text: "Sono sempre qui se ti serve una mano."
        },
        {
          title: "🎯 Missione",
          text: "Parla con uno dei bot per scoprire cosa può fare."
        }
      ]
    };
  }

  /* ============================================================
     2) MENU PRINCIPALE
  ============================================================= */
  if (intent === "menu") {
    return conv.conversationMenu();
  }

  /* ============================================================
     3) FAQ (se Router AI ha trovato una FAQ)
  ============================================================= */
  if (intent === "faq" && extras.faq) {
    return fb.fallbackFAQ(extras.faq);
  }

  /* ============================================================
     4) GUIDA (se Router AI ha trovato una guida)
  ============================================================= */
  if (intent === "guida" && extras.guide) {
    return fb.fallbackGuide(extras.guide);
  }

  /* ============================================================
     5) PRODOTTO NON RICONOSCIUTO
  ============================================================= */
  if (intent === "prodotto_sconosciuto" && extras.product) {
    return fb.fallbackProduct(extras.product);
  }

  /* ============================================================
     6) TUTORIAL PRODOTTO SENZA BOT CORRETTO
  ============================================================= */
  if (intent === "tutorial_prodotto" && !extras.guide) {
    return {
      avatar: "assistant",
      type: "mission",
      blocks: [
        {
          title: "📘 Tutorial prodotto",
          text: "Per i tutorial dettagliati ti consiglio di parlare con il Professore."
        },
        {
          title: "🎯 Missione",
          text: "Apri il Professore per continuare il tutorial."
        },
        {
          title: "Vai al Professore",
          cta: {
            label: "Apri Professore",
            href: "#professor"
          }
        }
      ]
    };
  }

  /* ============================================================
     7) FALLBACK GENERICO — con missione di esplorazione
  ============================================================= */
  return {
    avatar: "assistant",
    type: "mission",
    blocks: [
      {
        title: "🤔 Non ho capito bene",
        text: "Ma non preoccuparti, possiamo continuare!"
      },
      {
        title: "🎯 Missione suggerita",
        text: "Prova a chiedere qualcosa a uno dei bot specializzati."
      },
      {
        title: "Suggerimenti",
        text: "• Vendor: prodotti e catalogo<br>• Influencer: motivazione<br>• Professore: tutorial e guide"
      }
    ]
  };
}

/* ============================================================
   EXPORT NPC
============================================================ */
module.exports = {
  name: "generic",
  avatar: "assistant",
  match,
  run
};
