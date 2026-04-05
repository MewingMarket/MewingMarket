/**
 * modules/bot/handlers/conversation.cjs
 * Conversazione generale + Menu intelligente + Suggerimenti dinamici
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");

// 🔥 PATCH CHIRURGICA QUI
const Context = require("../../bot/context.cjs");

// Moduli dinamici
const FAQ = require("../../faq.cjs");
const Guides = require("../../guides.cjs");

/* ============================================================
   CONVERSAZIONE GENERICA
============================================================ */
async function handleConversationGeneric(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "conversazione", null);

  // 🔥 Ricerca automatica FAQ + Guide
  const faqMatch = FAQ.search(rawText);
  if (faqMatch) return reply(res, FAQ.render(faqMatch));

  const guideMatch = Guides.search(rawText);
  if (guideMatch) return reply(res, Guides.render(guideMatch));

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Ciao 👋</div>
  <div class="mm-card-body">
    Sono qui per aiutarti con:<br><br>
    • Catalogo prodotti<br>
    • Guide e FAQ<br>
    • Login / Registrazione<br>
    • Download e ordini<br>
    • Pagamenti e rimborsi<br><br>
    Vuoi vedere il <b>menu</b> o il <b>catalogo</b>?
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Conversazione",
    Memory.get(uid),
    pageContext,
    `
Rendi il messaggio più naturale, accogliente e utile.
Non inventare prodotti o link.
Suggerisci gentilmente cosa può fare l’utente.
    `.trim()
  );

  return reply(res, enriched || base);
}

/* ============================================================
   MENU INTELLIGENTE
============================================================ */
async function handleMenu(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "menu", null);

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Menu principale</div>
  <div class="mm-card-body">
    • Catalogo prodotti<br>
    • Guide e FAQ<br>
    • Login / Registrazione<br>
    • Download<br>
    • Ordini<br>
    • Pagamenti / PayPal<br>
    • Supporto<br>
    • Contatti<br>
    • Social<br><br>
    Scrivi una di queste parole.
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Menu",
    Memory.get(uid),
    pageContext,
    `
Rendi il messaggio più guidato e amichevole.
Non inventare categorie o funzioni.
    `.trim()
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

  return reply(res, `
<div class="mm-card">
  <div class="mm-card-body">
    Non ho capito bene.<br>
    Vuoi vedere il <b>menu</b>?
  </div>
</div>
`);
};
