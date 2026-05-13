/**
 * modules/bot/handlers/newsletter.cjs — VERSIONE 2027
 * Newsletter Helper — usato dal bot Newsletter AI
 * Nessun HTML, nessun GPT, solo JSON UI
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   ISCRIZIONE
============================================================ */
function newsletterSubscribe() {
  log("NEWSLETTER_SUBSCRIBE");

  return {
    type: "card",
    avatar: "newsletter_ai",
    layout: "newsletter_subscribe",
    title: "Iscrizione alla newsletter",
    text: "Riceverai contenuti utili, aggiornamenti e risorse pratiche.",
    actions: [
      { label: "Iscrivimi", value: "newsletter_subscribe_confirm" },
      { label: "Annulla", value: "menu" }
    ]
  };
}

/* ============================================================
   DISISCRIZIONE
============================================================ */
function newsletterUnsubscribe() {
  log("NEWSLETTER_UNSUBSCRIBE");

  return {
    type: "card",
    avatar: "newsletter_ai",
    layout: "newsletter_unsubscribe",
    title: "Annulla iscrizione",
    text: "Puoi annullare l’iscrizione in qualsiasi momento.",
    actions: [
      { label: "Disiscrivimi", value: "newsletter_unsubscribe_confirm" },
      { label: "Annulla", value: "menu" }
    ]
  };
}

/* ============================================================
   CONFERMA ISCRIZIONE
============================================================ */
function newsletterSubscribeConfirm(email = null) {
  return {
    type: "text",
    avatar: "newsletter_ai",
    text: email
      ? `Perfetto! Ho iscritto **${email}** alla newsletter.`
      : "Iscrizione completata!"
  };
}

/* ============================================================
   CONFERMA DISISCRIZIONE
============================================================ */
function newsletterUnsubscribeConfirm(email = null) {
  return {
    type: "text",
    avatar: "newsletter_ai",
    text: email
      ? `Ho rimosso **${email}** dalla newsletter.`
      : "Disiscrizione completata!"
  };
}

/* ============================================================
   FALLBACK GENERICO
============================================================ */
function newsletterGeneric() {
  return {
    type: "quick_replies",
    avatar: "newsletter_ai",
    text: "Vuoi iscriverti o disiscriverti dalla newsletter?",
    options: [
      { label: "Iscrivimi", value: "newsletter_subscribe" },
      { label: "Disiscrivimi", value: "newsletter_unsubscribe" }
    ]
  };
}

/* ============================================================
   EXPORT — usato da Newsletter AI
============================================================ */
module.exports = {
  newsletterSubscribe,
  newsletterUnsubscribe,
  newsletterSubscribeConfirm,
  newsletterUnsubscribeConfirm,
  newsletterGeneric
};
