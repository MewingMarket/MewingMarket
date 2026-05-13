/**
 * modules/bot/handlers/legal.cjs — VERSIONE 2027
 * Legal Helper — usato dal bot Professore AI
 * Nessun HTML, nessun GPT, solo JSON UI
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
    avatar: "professor_ai",
    layout: "legal",
    title: "Privacy Policy",
    text: "Raccogliamo solo i dati necessari (nome, email) per la newsletter e per la gestione degli ordini. I pagamenti sono gestiti da PayPal. Puoi richiedere modifica o cancellazione dei tuoi dati in qualsiasi momento.",
    actions: [
      { label: "Apri pagina completa", value: "open_privacy_page" },
      { label: "Torna al menu", value: "menu" }
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
    avatar: "professor_ai",
    layout: "legal",
    title: "Termini e Condizioni",
    text: "Vendiamo prodotti digitali con download immediato. L’uso è personale. I pagamenti sono gestiti tramite PayPal. Tutti i dettagli sono disponibili nella pagina completa.",
    actions: [
      { label: "Apri pagina completa", value: "open_terms_page" },
      { label: "Torna al menu", value: "menu" }
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
    avatar: "professor_ai",
    layout: "legal",
    title: "Cookie Policy",
    text: "Utilizziamo cookie tecnici per il funzionamento del sito e cookie analitici anonimi per migliorare l’esperienza utente. Nessun cookie di marketing o tracciamento esterno.",
    actions: [
      { label: "Apri pagina completa", value: "open_cookie_page" },
      { label: "Torna al menu", value: "menu" }
    ]
  };
}

/* ============================================================
   FALLBACK
============================================================ */
function legalGeneric() {
  return {
    type: "quick_replies",
    avatar: "professor_ai",
    text: "Vuoi informazioni su privacy, termini o cookie?",
    options: [
      { label: "Privacy", value: "privacy" },
      { label: "Termini", value: "termini" },
      { label: "Cookie", value: "cookie" }
    ]
  };
}

/* ============================================================
   EXPORT — usato da Professore AI
============================================================ */
module.exports = {
  legalPrivacy,
  legalTerms,
  legalCookie,
  legalGeneric
};
