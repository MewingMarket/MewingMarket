/**
 * modules/bot/handlers/conversation.cjs
 * Gestione conversazione generica + menu
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

/* ============================================================
   HANDLER CONVERSAZIONE GENERICA
   ============================================================ */
async function handleConversationGeneric(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Ciao 👋</div>
  <div class="mm-card-body">
    Sono qui per aiutarti con prodotti, supporto e consigli.<br><br>
    Vuoi vedere il <b>menu</b> o il <b>catalogo</b>?
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Conversazione",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più naturale e accogliente."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   HANDLER MENU
   ============================================================ */
async function handleMenu(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Menu principale</div>
  <div class="mm-card-body">
    • Catalogo<br>
    • Supporto<br>
    • Contatti<br>
    • Newsletter<br>
    • Social<br><br>
    Scrivi una di queste parole.
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Menu",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più guidato."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   ROUTER INTERNO
   ============================================================ */
module.exports = function conversationHandler(req, res, intent, sub, rawText) {
  log("HANDLER_CONVERSATION", { intent, sub, rawText });

  if (intent === "conversazione") {
    return handleConversationGeneric(req, res, rawText);
  }

  if (intent === "menu") {
    return handleMenu(req, res, rawText);
  }

  return reply(res, "Non ho capito, vuoi vedere il menu?");
};
