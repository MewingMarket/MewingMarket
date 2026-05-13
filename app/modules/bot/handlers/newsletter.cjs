/**
 * modules/bot/handlers/newsletter.cjs — VERSIONE VIDEOGIOCO 2027
 * Newsletter Helper — Newsletter AI
 * Nessun HTML, nessun GPT, solo JSON UI compatibile con Game Engine
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   ISCRIZIONE (spiegazione, non azione)
============================================================ */
function newsletterSubscribe() {
  log("NEWSLETTER_SUBSCRIBE");

  return {
    type: "card",
    avatar: "newsletter",
    layout: "newsletter_info",
    title: "Iscrizione alla newsletter",
    text: "Per iscriverti alla newsletter vai nella pagina dedicata e inserisci la tua email.",
    actions: [
      { label: "Apri pagina iscrizione", intent: "open_newsletter_page" },
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   DISISCRIZIONE (spiegazione, non azione)
============================================================ */
function newsletterUnsubscribe() {
  log("NEWSLETTER_UNSUBSCRIBE");

  return {
    type: "card",
    avatar: "newsletter",
    layout: "newsletter_info",
    title: "Annulla iscrizione",
    text: "Per disiscriverti puoi usare il link presente in fondo a ogni email che ricevi.",
    actions: [
      { label: "Apri pagina disiscrizione", intent: "open_unsubscribe_page" },
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   TUTORIAL TV (video)
============================================================ */
function newsletterTutorial(videoUrl) {
  return {
    type: "tutorial_card",
    avatar: "newsletter",
    title: "Come gestire la newsletter",
    steps: [
      "Apri la pagina dedicata",
      "Inserisci o rimuovi la tua email",
      "Conferma l’operazione"
    ],
    actions: [
      {
        label: "Guarda il video",
        type: "open_video",
        video_url: videoUrl
      }
    ]
  };
}

/* ============================================================
   FALLBACK GENERICO
============================================================ */
function newsletterGeneric() {
  return {
    type: "quick_replies",
    avatar: "newsletter",
    text: "Vuoi sapere come iscriverti o come disiscriverti dalla newsletter?",
    options: [
      { label: "Come iscrivermi", intent: "newsletter_subscribe" },
      { label: "Come disiscrivermi", intent: "newsletter_unsubscribe" }
    ]
  };
}

/* ============================================================
   EXPORT — Newsletter AI
============================================================ */
module.exports = {
  newsletterSubscribe,
  newsletterUnsubscribe,
  newsletterTutorial,
  newsletterGeneric
};
