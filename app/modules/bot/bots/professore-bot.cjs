/**
 * Professore AI — NPC tecnico / guida / spiegazioni (2027.4)
 * Path: app/modules/bot/bots/professore-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers
const support = require(path.join(process.cwd(), "app/modules/bot/handlers/support.cjs"));
const legal = require(path.join(process.cwd(), "app/modules/bot/handlers/legal.cjs"));

// Tutorial AI (DB + Video)
let tutorial = null;
let tutorialsAI = null;
try {
  tutorial = require(path.join(process.cwd(), "app/modules/tutorial/tutorial.cjs"));
  tutorialsAI = require(path.join(process.cwd(), "app/modules/tutorials.cjs"));
} catch {}

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "supporto",
    "ordini",
    "download",
    "pagamento",
    "rimborso",
    "contatti",
    "login",
    "registrazione",
    "password_reset",
    "privacy",
    "termini",
    "cookie",
    "guida",
    "tutorial_prodotto"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale Professore AI
============================================================ */
async function run(message, context = {}, extras = {}) {
  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";

  log("PROFESSORE_RUN", {
    uid: context.uid,
    logged: context.userLogged,
    intent
  });

  /* ============================================================
     0) GUEST MODE
  ============================================================= */
  if (!context.userLogged) {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "👨‍🏫 Modalità DEMO",
          text: "Sono il Professore. Posso darti spiegazioni base, ma per ricevere supporto tecnico completo devi accedere."
        },
        {
          title: "🎯 Missione",
          text: "Accedi per sbloccare tutorial, video AI e supporto tecnico avanzato."
        }
      ]
    };
  }

  /* ============================================================
     1) SUPPORTO STANDARD
  ============================================================= */
  if (intent === "login")          return support.supportLogin();
  if (intent === "registrazione")  return support.supportRegistrazione();
  if (intent === "password_reset") return support.supportPasswordReset();
  if (intent === "pagamento")      return support.supportPagamento();
  if (intent === "rimborso")       return support.supportRimborso();
  if (intent === "contatti")       return support.supportContatti();
  if (intent === "supporto")       return support.supportGeneric();

  /* ============================================================
     2) POLICY / LEGAL
  ============================================================= */
  if (intent === "privacy") return legal.legalPrivacy();
  if (intent === "termini") return legal.legalTerms();
  if (intent === "cookie")  return legal.legalCookie();

  /* ============================================================
     3) ORDINI
  ============================================================= */
  if (intent === "ordini") {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "📦 Come vedere i tuoi ordini",
          text: "Dashboard → *I miei ordini* → Trovi tutto lì."
        }
      ]
    };
  }

  /* ============================================================
     4) DOWNLOAD
  ============================================================= */
  if (intent === "download") {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "📥 Come accedere ai tuoi download",
          text: "Dashboard → *I miei download* → Scarica i file acquistati."
        }
      ]
    };
  }

  /* ============================================================
     5) GUIDA (Intent Engine 2027)
  ============================================================= */
  if (intent === "guida") {
    const guideKey = intentObj.tutorial?.guideKey || null;

    if (!guideKey) {
      return {
        avatar: "professor",
        type: "mission",
        blocks: [
          {
            title: "📘 Quale guida vuoi vedere?",
            text: "Dimmi cosa vuoi imparare."
          }
        ]
      };
    }

    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "📘 Guida rapida",
          text: `Sto preparando la guida: <b>${guideKey}</b>`
        }
      ]
    };
  }

  /* ============================================================
     6) TUTORIAL PRODOTTO (AI Video + DB)
  ============================================================= */
  if (intent === "tutorial_prodotto" && tutorial && tutorialsAI) {
    const slug = intentObj.slug || intentObj.productId || null;

    if (!slug) {
      return {
        avatar: "professor",
        type: "mission",
        blocks: [
          {
            title: "📘 Quale tutorial vuoi vedere?",
            text: "Dimmi il nome della guida o del problema che vuoi risolvere."
          }
        ]
      };
    }

    let guida = await tutorial.getTutorial(slug);

    if (!guida) {
      guida = {
        titolo: slug.replace(/-/g, " "),
        testo: message || "Guida generica.",
        video_url: null
      };
    }

    let videoUrl = guida.video_url;
    if (!videoUrl) {
      try {
        const gender = context.gender === "female" ? "female" : "male";
        videoUrl = await tutorialsAI.createTutorialForGuide(
          slug,
          guida.testo,
          "professor",
          gender
        );
      } catch {}
    }

    const blocks = [
      {
        title: `📘 ${guida.titolo}`,
        text: guida.testo
      }
    ];

    if (videoUrl) {
      blocks.push({
        title: "Guarda il video tutorial",
        cta: {
          label: "Apri video",
          href: videoUrl
        }
      });
    }

    return {
      avatar: "professor",
      type: "mission",
      blocks
    };
  }

  /* ============================================================
     7) FALLBACK
  ============================================================= */
  return {
    avatar: "professor",
    type: "mission",
    blocks: [
      {
        title: "Come posso aiutarti?",
        text: "• Ordini<br>• Download<br>• Supporto tecnico<br>• Spiegazioni<br>• Tutorial prodotto"
      }
    ]
  };
}

/* ============================================================
   EXPORT NPC
============================================================ */
module.exports = {
  name: "professor",
  avatar: "professor",
  match,
  run
};
