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
    "come_funziona"
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
     0) GUEST MODE → SOLO SPIEGAZIONI BASE
  ============================================================= */
  if (!context.userLogged) {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "👨‍🏫 Modalità DEMO",
          text: "Sono il Professore. Posso aiutarti con spiegazioni tecniche, ma per accedere al supporto completo devi effettuare il login."
        },
        {
          title: "Cosa posso fare ora",
          text: "• Spiegazioni base<br>• Come funziona il sito<br>• Come accedere ai download"
        },
        {
          title: "Sblocca il supporto completo",
          text: "Accedi al sito per ricevere assistenza tecnica personalizzata."
        }
      ]
    };
  }

  /* ============================================================
     1) ORDINI (spiegazione)
  ============================================================= */
  if (intent === "ordini") {
    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "📦 Come vedere i tuoi ordini",
          text: "Accedi alla Dashboard → Sezione *I miei ordini* → Trovi tutto lì."
        }
      ]
    };
  }

  /* ============================================================
     2) DOWNLOAD (spiegazione)
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
     3) SUPPORTO STANDARD (usa Support Helper)
  ============================================================= */
  if (intent === "login")          return support.supportLogin();
  if (intent === "registrazione")  return support.supportRegistrazione();
  if (intent === "password_reset") return support.supportPasswordReset();
  if (intent === "pagamento")      return support.supportPagamento();
  if (intent === "rimborso")       return support.supportRimborso();
  if (intent === "contatti")       return support.supportContatti();
  if (intent === "supporto")       return support.supportGeneric();

  /* ============================================================
     4) POLICY / LEGAL (usa Legal Helper)
  ============================================================= */
  if (intent === "privacy") return legal.legalPrivacy();
  if (intent === "termini") return legal.legalTerms();
  if (intent === "cookie")  return legal.legalCookie();

  /* ============================================================
     5) MISSIONE DIDATTICA AUTOMATICA (core del Professore)
  ============================================================= */
  if (intent === "problema" || intent === "errore" || intent === "tecnico") {
    const problema = message || "Problema non specificato";

    // Estrae prodotto scelto dall’utente (se presente)
    const prodotto = context.selectedProduct
      ? await productHandler.getProduct(context.selectedProduct)
      : null;

    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "👨‍🏫 Ho analizzato il tuo problema",
          text: problema
        },
        {
          title: "Perché succede",
          text: prodotto
            ? prodotto.descrizione_tecnica || "Questo problema è comune e si risolve facilmente."
            : "Questo problema è comune e si risolve facilmente."
        },
        {
          title: "Cosa fare ora",
          text: prodotto
            ? prodotto.step_tecnici || "1) Controlla la posizione\n2) Ripeti l’esercizio\n3) Verifica dopo 7 giorni"
            : "1) Controlla la posizione\n2) Ripeti l’esercizio\n3) Verifica dopo 7 giorni"
        },
        prodotto
          ? {
              title: "Vuoi approfondire?",
              cta: {
                label: "Apri la guida completa",
                href: `/prodotto/${prodotto.id}`
              }
            }
          : null
      ].filter(Boolean)
    };
  }

  /* ============================================================
     6) SPIEGAZIONI TECNICHE
  ============================================================= */
  if (intent === "come_funziona") {
    const video = "https://cdn.mewingmarket.it/video/come-funziona.mp4";

    return {
      avatar: "professor",
      type: "mission",
      blocks: [
        {
          title: "📘 Come funziona il sistema",
          text: "Acquisti un prodotto digitale → Lo trovi subito nella Dashboard → Puoi scaricarlo quando vuoi."
        },
        {
          title: "Guarda il video",
          cta: {
            label: "Apri video",
            href: video
          }
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
        }
      ]
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
        text: "• Ordini<br>• Download<br>• Problemi tecnici<br>• Spiegazioni"
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
