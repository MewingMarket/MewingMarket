/**
 * Influencer AI — NPC motivazionale / PR / video (2027.4)
 * Path: app/modules/bot/bots/influencer-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers
const social = require(path.join(process.cwd(), "app/modules/bot/handlers/social.cjs"));

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "video",
    "motivazione",
    "tutorial_prodotto",
    "social",
    "newsletter",
    "generico"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}, extras = {}) {
  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const productId = intentObj.productId || null;
  const catalogo = context.catalogo || [];

  log("INFLUENCER_RUN", {
    uid: context.uid,
    intent,
    productId,
    catalogCount: catalogo.length
  });

  /* ============================================================
     0) GUEST MODE → MOTIVAZIONE + MISSIONE DI ONBOARDING
  ============================================================= */
  if (!context.userLogged) {
    return {
      avatar: "influencer",
      type: "mission",
      blocks: [
        {
          title: "🔥 Modalità DEMO",
          text: "Io sono l'Influencer. Posso motivarti e mostrarti i nostri social."
        },
        {
          title: "🎯 Missione",
          text: "Accedi per sbloccare video esclusivi, missioni e premi."
        },
        {
          title: "Vuoi restare aggiornato?",
          text: "Iscriviti alla newsletter per ricevere consigli e novità."
        }
      ]
    };
  }

  /* ============================================================
     1) VIDEO / TUTORIAL PRODOTTO
  ============================================================= */
  if (intent === "video" || intent === "tutorial_prodotto") {
    if (!productId) {
      return {
        avatar: "influencer",
        type: "mission",
        blocks: [
          {
            title: "🎥 Quale prodotto vuoi vedere?",
            text: "Scegli un prodotto e ti mostro un video tutorial."
          },
          {
            title: "🎯 Missione",
            text: "Apri un prodotto dal catalogo."
          }
        ]
      };
    }

    const p = catalogo.find(x => x.id === productId);
    if (!p) {
      return {
        avatar: "influencer",
        type: "text",
        text: "Non trovo il prodotto per il tutorial."
      };
    }

    const safeUrl = typeof p.youtube_url === "string" ? p.youtube_url : null;

    return {
      type: "mission",
      avatar: "influencer",
      blocks: [
        {
          title: `🎥 Tutorial rapido: ${p.titolo_breve}`,
          text: "Ecco un video rapido per capire come funziona."
        },
        {
          title: "Passaggi",
          text: "1) Guarda il video<br>2) Segui i passaggi<br>3) Applica subito ciò che impari"
        },
        safeUrl
          ? {
              title: "Guarda il video",
              cta: {
                label: "Apri video",
                href: safeUrl
              }
            }
          : null
      ].filter(Boolean)
    };
  }

  /* ============================================================
     2) MOTIVAZIONE
  ============================================================= */
  if (intent === "motivazione") {
    return {
      avatar: "influencer",
      type: "mission",
      blocks: [
        {
          title: "🔥 Motivazione",
          text: "Ogni passo che fai costruisce una versione più forte di te."
        },
        {
          title: "🎯 Missione",
          text: "Guarda un video motivazionale o chiedi un consiglio rapido."
        }
      ]
    };
  }

  /* ============================================================
     3) SOCIAL — Instagram / TikTok / YouTube
  ============================================================= */
  if (intent === "social" || intent === "newsletter") {
    try {
      const post = await social.getRandomForLIM?.("instagram");
      if (post) return post;
    } catch (err) {
      log("INFLUENCER_SOCIAL_ERR", err);
    }

    return {
      avatar: "influencer",
      type: "mission",
      blocks: [
        {
          title: "📱 Seguici sui social",
          text: "Per vedere esempi reali, trasformazioni e consigli quotidiani."
        },
        {
          title: "🎯 Missione",
          text: "Apri uno dei nostri social."
        }
      ]
    };
  }

  /* ============================================================
     4) GUIDA → fallback al Professore
  ============================================================= */
  if (intent === "guida") {
    return {
      avatar: "influencer",
      type: "mission",
      blocks: [
        {
          title: "📘 Guida",
          text: "Per le guide dettagliate ti consiglio di parlare con il Professore."
        },
        {
          title: "🎯 Missione",
          text: "Apri il Professore per continuare."
        }
      ]
    };
  }

  /* ============================================================
     5) FALLBACK INFLUENCER
  ============================================================= */
  return {
    avatar: "influencer",
    type: "mission",
    blocks: [
      {
        title: "🔥 Cosa vuoi fare?",
        text: "• Mostra un video<br>• Motivami<br>• Seguimi sui social"
      },
      {
        title: "🎯 Missione suggerita",
        text: "Chiedi un video motivazionale!"
      }
    ]
  };
}

/* ============================================================
   SIDEKICK — compresenza (quando parla il Vendor)
============================================================ */
async function sidekick(message, context = {}) {
  log("INFLUENCER_SIDEKICK", { productId: context.intent?.productId });

  return {
    avatar: "influencer",
    type: "mission",
    blocks: [
      {
        title: "🔥 Questo prodotto spacca!",
        text: "Se vuoi ti mostro anche un video motivazionale."
      },
      {
        title: "🎯 Missione combo",
        text: "Parla con due NPC diversi nella stessa sessione."
      }
    ]
  };
}

/* ============================================================
   EXPORT NPC
============================================================ */
module.exports = {
  name: "influencer",
  avatar: "influencer",
  match,
  run,
  sidekick
};
