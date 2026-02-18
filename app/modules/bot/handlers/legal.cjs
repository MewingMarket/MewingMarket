/**
 * modules/bot/handlers/legal.cjs
 * Gestione privacy, termini e cookie
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

/* ============================================================
   PRIVACY
============================================================ */
async function handlePrivacy(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH: aggiorna contesto automaticamente
  Context.update(uid, "privacy", null);

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Privacy Policy</div>
  <div class="mm-card-body">
    In sintesi:<br>
    • raccogliamo nome e email per la newsletter<br>
    • i pagamenti sono gestiti da Payhip<br>
    • puoi chiedere modifica o cancellazione dei dati<br><br>
    Pagina completa:<br>
    <a href="privacy.html">privacy.html</a>
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Privacy policy",
    Memory.get(uid),
    pageContext,
    "\nRendi il tono più rassicurante."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   TERMINI E CONDIZIONI
============================================================ */
async function handleTerms(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH: aggiorna contesto automaticamente
  Context.update(uid, "termini", null);

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Termini e Condizioni</div>
  <div class="mm-card-body">
    In sintesi:<br>
    • vendiamo prodotti digitali tramite Payhip<br>
    • l'uso è personale<br>
    • il download è immediato<br><br>
    Pagina completa:<br>
    <a href="termini-e-condizioni.html">termini-e-condizioni.html</a>
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Termini e condizioni",
    Memory.get(uid),
    pageContext,
    "\nRendi il tono più umano."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   COOKIE
============================================================ */
async function handleCookie(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH: aggiorna contesto automaticamente
  Context.update(uid, "cookie", null);

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Cookie</div>
  <div class="mm-card-body">
    Usiamo cookie tecnici e analytics per migliorare il sito.<br><br>
    Pagina completa:<br>
    <a href="cookie.html">cookie.html</a>
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Cookie policy",
    Memory.get(uid),
    pageContext,
    "\nNormalizza l'uso dei cookie senza banalizzare."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   ROUTER INTERNO
============================================================ */
module.exports = function legalHandler(req, res, intent, rawText) {
  log("HANDLER_LEGAL", { intent, rawText });

  if (intent === "privacy") return handlePrivacy(req, res, rawText);
  if (intent === "termini") return handleTerms(req, res, rawText);
  if (intent === "cookie") return handleCookie(req, res, rawText);

  return reply(res, "Vuoi informazioni su privacy, termini o cookie?");
};
