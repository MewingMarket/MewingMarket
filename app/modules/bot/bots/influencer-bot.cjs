/**
 * Influencer AI — NPC motivazionale / PR / video (2027)
 * Path: app/modules/bot/bots/influencer-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers
const social = require(path.join(process.cwd(), "app/modules/bot/handlers/social.cjs"));
const catalogHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/catalogHandler.cjs"));
const productHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/productHandler.cjs"));

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "video_prodotto",
    "video_motivazionale",
    "tutorial_prodotto",
    "motivazione",
    "consiglio_rapido",
    "consiglio_del_giorno",
    "influencer",
    "social",
    "seguimi"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}) {
  log("INFLUENCER_RUN", {
    uid: context.uid,
    logged: context.userLogged,
    intent: context.intent?.intent,
    productId: context.intent?.productId,
    catalogCount: context.catalog?.length || 0
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const productId = intentObj.productId || null;
  const catalog = context.catalog || [];

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
     1) VIDEO TUTORIAL PRODOTTO (missione: product_tutorial)
  ============================================================= */
  if (intent === "video_prodotto" || intent === "tutorial_prodotto") {
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

    const p = catalog.find(x => x.id === productId);
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
     2) VIDEO MOTIVAZIONALE (missione: watch_motivation_video)
  ============================================================= */
  if (intent === "video_motivazionale") {
    return {
      type: "mission",
      avatar: "influencer",
      blocks: [
        {
          title: "🔥 Video motivazionale",
          text: "Respira, concentrati, riparti più forte."
        },
        {
          title: "Guarda il video",
          cta: {
            label: "Apri video",
            href: "https://cdn.mewingmarket.it/video/motivazione-1.mp4"
          }
        }
      ]
    };
  }

  /* ============================================================
     3) MOTIVAZIONE / HYPE (missione: ask_motivation)
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
     4) CONSIGLIO RAPIDO (missione: quick_tip)
  ============================================================= */
  if (intent === "consiglio_rapido") {
    return {
      avatar: "influencer",
      type: "mission",
      blocks: [
        {
          title: "⚡ Consigli rapidi",
          text: "🔥 Migliora subito<br>📘 Impara una cosa nuova<br>💡 Consiglio del giorno"
        },
        {
          title: "🎯 Missione",
          text: "Chiedi il consiglio del giorno."
        }
      ]
    };
  }

  /* ============================================================
     5) CONSIGLIO DEL GIORNO (missione: daily_tip)
  ============================================================= */
  if (intent === "consiglio_del_giorno") {
    return {
      avatar: "influencer",
      type: "mission",
      blocks: [
        {
          title: "💡 Consiglio del giorno",
          text: "Non aspettare il momento perfetto. Il momento perfetto è quando decidi di iniziare."
        },
        {
          title: "🎯 Missione completabile",
          text: "Hai ottenuto il consiglio del giorno!"
        }
      ]
    };
  }

  /* ============================================================
     6) SOCIAL (missione: open_social)
  ============================================================= */
  if (intent === "social" || intent === "seguimi" || intent === "influencer") {
    try {
      const post = await social.getRandomForLIM?.("instagram");
      if (post) return post;
    } catch (e) {}

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
        },
        {
          title: "Link",
          text:
            "<a href='https://instagram.com/...'>Instagram</a><br>" +
            "<a href='https://tiktok.com/...'>TikTok</a><br>" +
            "<a href='https://youtube.com/...'>YouTube</a>"
        }
      ]
    };
  }

  /* ============================================================
     7) FALLBACK INFLUENCER
  ============================================================= */
  return {
    avatar: "influencer",
    type: "mission",
    blocks: [
      {
        title: "🔥 Cosa vuoi fare?",
        text: "• Mostra un video<br>• Consiglio rapido<br>• Motivami<br>• Seguimi sui social"
      },
      {
        title: "🎯 Missione suggerita",
        text: "Chiedi un consiglio rapido!"
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
