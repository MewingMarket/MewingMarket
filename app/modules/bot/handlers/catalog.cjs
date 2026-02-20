/**
 * modules/bot/handlers/catalog.cjs
 * Gestione catalogo prodotti
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

/* ============================================================
   HANDLER CATALOGO
============================================================ */
module.exports = async function catalogHandler(req, res, rawText, PRODUCTS) {
  log("HANDLER_CATALOG", { rawText });

  if (!PRODUCTS || !PRODUCTS.length) {
    return reply(res, "Il catalogo sarà presto disponibile.");
  }

  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH: aggiorna contesto automaticamente
  Context.update(uid, "catalogo", null);

  let out = `
<div class="mm-card">
  <div class="mm-card-title">📚 Catalogo MewingMarket</div>
  <div class="mm-card-body">
`;

  for (const p of PRODUCTS) {
    out += `
• <b>${p.titoloBreve || p.titolo}</b> — ${p.prezzo}€<br>
<a href="${p.linkPayhip}">${p.linkPayhip}</a><br><br>
`;
  }

  out += `
  </div>
</div>

<div class="mm-info">
Scrivi il nome di un prodotto o il tuo obiettivo.
</div>
`;

  const enriched = await callGPT(
    rawText || "Mostra catalogo",
    Memory.get(uid),
    pageContext,
    "\nAggiungi una frase finale che inviti a chiedere consiglio.",
    { products: PRODUCTS }
  );

  return reply(res, out + (enriched || ""));
};
