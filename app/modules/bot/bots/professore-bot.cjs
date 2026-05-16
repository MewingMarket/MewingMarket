/**
 * Professore AI — NPC tecnico / guida / spiegazioni (2027)
 * Path: app/modules/bot/bots/professore-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers
const support = require(path.join(process.cwd(), "app/modules/bot/handlers/support.cjs"));
const legal = require(path.join(process.cwd(), "app/modules/bot/handlers/legal.cjs"));
const productHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/productHandler.cjs"));

// Tutorial AI (DB + Video)
let tutorial = null;
let tutorialsAI = null;
try {
  tutorial = require(path.join(process.cwd(), "app/modules/tutorial/tutorial.cjs"));
  tutorialsAI = require(path.join(process.cwd(), "app/modules/tutorials.cjs"));
} catch {
  // opzionale
}

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "supporto",
    "problema",
    "errore",
    "tecnico",
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
    "spiega",
    "come_funziona",
    "tutorial_prodotto"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale Professore AI
============================================================ */
async function run(message, context = {}) {
  log("PROFESSORE_RUN", {
    uid: context.uid,
    logged: context.userLogged,
    intent: context.intent?.intent
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";

  /* ============================================================
     0) GUEST MODE → SOLO SPIEGAZIONI BASE + missione onboarding
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
        },
        {
          title: "Cosa posso fare ora",
          text: "• Spiegazioni semplici<br>• Come funziona il sito<br>• Come accedere ai download"
        }
      ]
    };
  }

  /* ============================================================
     1) ORDINI (missione: view_orders)
  ============================================================= */
  if (intent === "ordini") {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "📦 Come vedere i tuoi ordini",
          text: "Dashboard → *I miei ordini* → Trovi tutto lì."
        },
        {
          title: "🎯 Missione",
          text: "Hai visualizzato la guida sugli ordini!"
        }
      ]
    };
  }

  /* ============================================================
     2) DOWNLOAD (missione: view_downloads)
  ============================================================= */
  if (intent === "download") {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "📥 Come accedere ai tuoi download",
          text: "Dashboard → *I miei download* → Scarica i file acquistati."
        },
        {
          title: "🎯 Missione",
          text: "Hai visualizzato la guida ai download!"
        }
      ]
    };
  }

  /* ============================================================
     3) SUPPORTO STANDARD (missioni automatiche via chat.cjs)
  ============================================================= */
  if (intent === "login")          return support.supportLogin();
  if (intent === "registrazione")  return support.supportRegistrazione();
  if (intent === "password_reset") return support.supportPasswordReset();
  if (intent === "pagamento")      return support.supportPagamento();
  if (intent === "rimborso")       return support.supportRimborso();
  if (intent === "contatti")       return support.supportContatti();
  if (intent === "supporto")       return support.supportGeneric();

  /* ============================================================
     4) POLICY / LEGAL
  ============================================================= */
  if (intent === "privacy") return legal.legalPrivacy();
  if (intent === "termini") return legal.legalTerms();
  if (intent === "cookie")  return legal.legalCookie();

  /* ============================================================
     5) PROBLEMA TECNICO (missione: technical_help)
  ============================================================= */
  if (intent === "problema" || intent === "errore" || intent === "tecnico") {
    const problema = message || "Problema non specificato";

    const guida = context.selectedGuide
      ? await productHandler.getGuide(context.selectedGuide)
      : null;

    const blocks = [
      {
        title: "👨‍🏫 Ho analizzato il tuo problema",
        text: problema
      },
      {
        title: "Perché succede",
        text: guida
          ? guida.spiegazione_tecnica || "Questo problema è comune e si risolve facilmente."
          : "Questo problema è comune e si risolve facilmente."
      },
      {
        title: "Cosa fare ora",
        text: guida
          ? guida.step_tecnici || "1) Controlla la posizione\n2) Ripeti l’esercizio\n3) Verifica dopo 7 giorni"
          : "1) Controlla la posizione\n2) Ripeti l’esercizio\n3) Verifica dopo 7 giorni"
      },
      {
        title: "🎯 Missione",
        text: "Hai richiesto assistenza tecnica!"
      }
    ];

    if (guida) {
      blocks.push({
        title: "Vuoi approfondire?",
        cta: {
          label: "Apri la guida completa",
          href: `/guida/${guida.id}`
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
     6) TUTORIAL PRODOTTO + VIDEO AI (missione: product_tutorial)
  ============================================================= */
  if (intent === "tutorial_prodotto" && tutorial && tutorialsAI) {
    const slug = intentObj.slug || null;

    if (!slug) {
      return {
        avatar: "professor",
        type: "mission",
        blocks: [
          {
            title: "📘 Quale tutorial vuoi vedere?",
            text: "Dimmi il nome della guida o del problema che vuoi risolvere."
          },
          {
            title: "🎯 Missione",
            text: "Scegli un tutorial prodotto."
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
      },
      {
        title: "🎯 Missione",
        text: "Hai aperto un tutorial prodotto!"
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
     7) SPIEGAZIONI TECNICHE (missione: explanation)
  ============================================================= */
  if (intent === "come_funziona") {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "📘 Come funziona il sistema",
          text: "Acquisti un prodotto digitale → Lo trovi subito nella Dashboard → Puoi scaricarlo quando vuoi."
        },
        {
          title: "🎯 Missione",
          text: "Hai richiesto una spiegazione tecnica!"
        }
      ]
    };
  }

  if (intent === "spiega") {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "Dimmi cosa vuoi che ti spieghi",
          text: "Sono qui per aiutarti con qualsiasi dubbio tecnico."
        },
        {
          title: "🎯 Missione",
          text: "Hai aperto una richiesta di spiegazione!"
        }
      ]
    };
  }

  /* ============================================================
     8) FALLBACK
  ============================================================= */
  return {
    avatar: "professor",
    type: "mission",
    blocks: [
      {
        title: "Come posso aiutarti?",
        text: "• Ordini<br>• Download<br>• Problemi tecnici<br>• Spiegazioni<br>• Tutorial prodotto"
      },
      {
        title: "🎯 Missione suggerita",
        text: "Prova a chiedere un tutorial prodotto!"
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
