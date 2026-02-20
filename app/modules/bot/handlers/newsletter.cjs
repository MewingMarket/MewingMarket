/**
 * modules/bot/handlers/newsletter.cjs
 * Gestione conversazione newsletter (subscribe / unsubscribe)
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

/* ============================================================
   HANDLER DISISCRIZIONE
============================================================ */
async function handleUnsubscribe(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH: aggiorna contesto automaticamente
  Context.update(uid, "newsletter", "unsubscribe");

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Annulla iscrizione</div>
  <div class="mm-card-body">
    Puoi annullare l'iscrizione qui:<br>
    <a href="disiscriviti.html">disiscriviti.html</a><br><br>
    Se hai problemi: supporto@mewingmarket.it
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Disiscrizione newsletter",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più empatico."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   HANDLER ISCRIZIONE
============================================================ */
async function handleSubscribe(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH: aggiorna contesto automaticamente
  Context.update(uid, "newsletter", "subscribe");

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Iscriviti alla newsletter</div>
  <div class="mm-card-body">
    Riceverai contenuti utili, aggiornamenti e risorse pratiche.<br><br>
    <a href="iscrizione.html">iscrizione.html</a>
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Iscrizione newsletter",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più motivante."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   ROUTER INTERNO
============================================================ */
module.exports = function newsletterHandler(req, res, sub, rawText) {
  log("HANDLER_NEWSLETTER", { sub, rawText });

  if (sub === "unsubscribe") {
    return handleUnsubscribe(req, res, rawText);
  }

  return handleSubscribe(req, res, rawText);
};
