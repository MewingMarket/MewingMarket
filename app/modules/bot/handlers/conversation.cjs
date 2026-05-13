/**
 * modules/bot/handlers/conversation.cjs — VERSIONE VIDEOGIOCO 2027
 * Conversation Helper — Avatar Generico (Narratore)
 * Nessun HTML, nessun GPT, solo JSON UI compatibile con Game Engine
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   CONVERSAZIONE GENERICA (onboarding)
============================================================ */
function conversationGeneric() {
  log("CONVERSATION_GENERIC");

  return {
    type: "quick_replies",
    avatar: "assistant",
    text: "Ciao! Benvenuto nel tuo spazio interattivo. Posso guidarti tra catalogo, guide, supporto, social e newsletter. Dove vuoi andare?",
    options: [
      { label: "Catalogo", intent: "catalogo" },
      { label: "Supporto", intent: "supporto" },
      { label: "Social", intent: "social" },
      { label: "Newsletter", intent: "newsletter" },
      { label: "Menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   MENU PRINCIPALE (navigazione)
============================================================ */
function conversationMenu() {
  log("CONVERSATION_MENU");

  return {
    type: "list",
    avatar: "assistant",
    title: "Menu principale",
    items: [
      { label: "Catalogo prodotti", intent: "catalogo" },
      { label: "Guide e FAQ", intent: "faq" },
      { label: "Supporto", intent: "supporto" },
      { label: "Ordini", intent: "ordini" },
      { label: "Download", intent: "download" },
      { label: "Pagamenti", intent: "pagamento" },
      { label: "Rimborsi", intent: "rimborso" },
      { label: "Social", intent: "social" },
      { label: "Newsletter", intent: "newsletter" }
    ],
    actions: [
      { label: "Torna indietro", intent: "home" }
    ]
  };
}

/* ============================================================
   TUTORIAL TV (video onboarding)
============================================================ */
function conversationTutorial(videoUrl) {
  return {
    type: "tutorial_card",
    avatar: "assistant",
    title: "Come usare questo spazio",
    steps: [
      "Naviga tra i menu",
      "Interagisci con gli avatar",
      "Guarda i video tutorial sulla TV"
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
   FALLBACK
============================================================ */
function conversationFallback() {
  return {
    type: "quick_replies",
    avatar: "assistant",
    text: "Non ho capito bene. Vuoi tornare al menu principale?",
    options: [
      { label: "Apri menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   EXPORT — Avatar Generico
============================================================ */
module.exports = {
  conversationGeneric,
  conversationMenu,
  conversationTutorial,
  conversationFallback
};
