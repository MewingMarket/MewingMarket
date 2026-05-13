/**
 * modules/bot/handlers/legal.cjs — VERSIONE VIDEOGIOCO 2027 (PATCH COMPLETA)
 * Legal Helper — Professore AI
 * Nessun HTML, nessun GPT, solo JSON UI compatibile con Game Engine
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   PRIVACY POLICY
============================================================ */
function legalPrivacy() {
  log("LEGAL_PRIVACY");

  return {
    type: "card",
    avatar: "professor",
    layout: "legal",
    title: "Privacy Policy",
    text:
      "Raccogliamo solo i dati necessari (nome, email) per newsletter e gestione ordini. " +
      "I pagamenti sono gestiti da PayPal. Puoi richiedere modifica o cancellazione dei tuoi dati in qualsiasi momento.",
    actions: [
      { label: "Apri pagina completa", intent: "open_privacy_page" },
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   TERMINI E CONDIZIONI
============================================================ */
function legalTerms() {
  log("LEGAL_TERMS");

  return {
    type: "card",
    avatar: "professor",
    layout: "legal",
    title: "Termini e Condizioni",
    text:
      "Vendiamo prodotti digitali con download immediato. L’uso è personale. " +
      "I pagamenti sono gestiti tramite PayPal. Tutti i dettagli sono disponibili nella pagina completa.",
    actions: [
      { label: "Apri pagina completa", intent: "open_terms_page" },
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   COOKIE POLICY
============================================================ */
function legalCookie() {
  log("LEGAL_COOKIE");

  return {
    type: "card",
    avatar: "professor",
    layout: "legal",
    title: "Cookie Policy",
    text:
      "Utilizziamo cookie tecnici per il funzionamento del sito e cookie analitici anonimi per migliorare l’esperienza. " +
      "Nessun cookie di marketing o tracciamento esterno.",
    actions: [
      { label: "Apri pagina completa", intent: "open_cookie_page" },
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   TUTORIAL TV (video)
============================================================ */
function legalTutorial(videoUrl) {
  log("LEGAL_TUTORIAL", { videoUrl });

  const safeUrl = typeof videoUrl === "string" ? videoUrl : null;

  return {
    type: "tutorial_card",
    avatar: "professor",
    title: "Come funzionano le policy",
    steps: [
      "Guarda il video sulla TV",
      "Comprendi privacy, termini e cookie",
      "Consulta le pagine complete se ti servono dettagli"
    ],
    actions: safeUrl
      ? [
          {
            label: "Guarda il video",
            type: "open_video",
            video_url: safeUrl
          }
        ]
      : []
  };
}

/* ============================================================
   FALLBACK
============================================================ */
function legalGeneric() {
  log("LEGAL_GENERIC");

  return {
    type: "quick_replies",
    avatar: "professor",
    text: "Vuoi informazioni su privacy, termini o cookie?",
    options: [
      { label: "Privacy", intent: "legal_privacy" },
      { label: "Termini", intent: "legal_terms" },
      { label: "Cookie", intent: "legal_cookie" },
      { label: "Menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   EXPORT — Professore AI
============================================================ */
module.exports = {
  legalPrivacy,
  legalTerms,
  legalCookie,
  legalTutorial,
  legalGeneric
};
