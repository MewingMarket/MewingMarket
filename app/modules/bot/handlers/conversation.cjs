/**
 * modules/bot/handlers/conversation.cjs — VERSIONE 2027
 * Conversation Helper — usato dal bot Avatar Generico
 * Nessun HTML, nessun GPT, solo JSON UI
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   CONVERSAZIONE GENERICA
============================================================ */
function conversationGeneric() {
  log("CONVERSATION_GENERIC");

  return {
    type: "quick_replies",
    avatar: "assistant",
    text: "Ciao! Posso aiutarti con il catalogo, le guide, il supporto, i social o la newsletter. Cosa vuoi fare?",
    options: [
      { label: "Catalogo", value: "catalogo" },
      { label: "Supporto", value: "supporto" },
      { label: "Social", value: "social" },
      { label: "Newsletter", value: "newsletter" },
      { label: "Menu", value: "menu" }
    ]
  };
}

/* ============================================================
   MENU PRINCIPALE
============================================================ */
function conversationMenu() {
  log("CONVERSATION_MENU");

  return {
    type: "list",
    avatar: "assistant",
    title: "Menu principale",
    items: [
      { label: "Catalogo prodotti", value: "catalogo" },
      { label: "Guide e FAQ", value: "faq" },
      { label: "Supporto", value: "supporto" },
      { label: "Ordini", value: "ordini" },
      { label: "Download", value: "download" },
      { label: "Pagamenti", value: "pagamento" },
      { label: "Rimborsi", value: "rimborso" },
      { label: "Social", value: "social" },
      { label: "Newsletter", value: "newsletter" }
    ],
    actions: [
      { label: "Torna indietro", value: "home" }
    ]
  };
}

/* ============================================================
   FALLBACK
============================================================ */
function conversationFallback() {
  return {
    type: "text",
    avatar: "assistant",
    text: "Non ho capito bene. Vuoi vedere il menu?"
  };
}

/* ============================================================
   EXPORT — usato da Avatar Generico
============================================================ */
module.exports = {
  conversationGeneric,
  conversationMenu,
  conversationFallback
};
