/**
 * modules/bot/handlers/support.cjs
 * Gestione supporto, problemi, download, Payhip, rimborsi
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

/* ============================================================
   SUPPORTO GENERICO
============================================================ */
async function handleSupportGeneric(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH: aggiorna contesto automaticamente
  Context.update(uid, "supporto", null);

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Supporto</div>
  <div class="mm-card-body">
    Posso aiutarti con:<br>
    • Problemi di download<br>
    • Payhip<br>
    • Rimborso<br>
    • Contatti<br><br>
    Scrivi una di queste parole.
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Supporto generico",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più rassicurante."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   SUPPORTO DOWNLOAD
============================================================ */
async function handleDownload(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH
  Context.update(uid, "supporto", "download");

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Problemi di download</div>
  <div class="mm-card-body">
    Se hai acquistato un prodotto ma non riesci a scaricarlo:<br><br>
    1️⃣ Controlla l'email di Payhip<br>
    2️⃣ Cerca nella cartella spam<br>
    3️⃣ Se non trovi nulla, scrivi a:<br>
    <b>supporto@mewingmarket.it</b><br><br>
    Vuoi che ti aiuti a recuperare il link?
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Supporto download",
    Memory.get(uid),
    pageContext,
    "\nAggiungi una frase che inviti a spiegare il problema."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   SUPPORTO PAYHIP
============================================================ */
async function handlePayhip(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH
  Context.update(uid, "supporto", "payhip");

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Supporto Payhip</div>
  <div class="mm-card-body">
    Payhip gestisce pagamenti e download.<br><br>
    Se hai problemi con un ordine, scrivi a:<br>
    <b>supporto@mewingmarket.it</b><br><br>
    Vuoi spiegarmi cosa è successo?
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Supporto Payhip",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più chiaro e utile."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   SUPPORTO RIMBORSO
============================================================ */
async function handleRefund(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH
  Context.update(uid, "supporto", "rimborso");

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Richiesta rimborso</div>
  <div class="mm-card-body">
    Per richiedere un rimborso scrivi a:<br>
    <b>supporto@mewingmarket.it</b><br><br>
    Inserisci:<br>
    • Email dell'ordine<br>
    • Nome del prodotto<br>
    • Motivo della richiesta<br><br>
    Vuoi che ti aiuti a preparare il messaggio?
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Supporto rimborso",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più empatico."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   SUPPORTO CONTATTO
============================================================ */
async function handleContact(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // ⭐ PATCH
  Context.update(uid, "supporto", "contatto");

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Contatti</div>
  <div class="mm-card-body">
    Puoi contattarci qui:<br>
    <b>supporto@mewingmarket.it</b><br><br>
    Rispondiamo entro 24 ore.
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Supporto contatto",
    Memory.get(uid),
    pageContext,
    "\nAggiungi una frase che inviti a descrivere il problema."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   ROUTER INTERNO
============================================================ */
module.exports = function supportHandler(req, res, sub, rawText) {
  log("HANDLER_SUPPORT", { sub, rawText });

  if (sub === "download") return handleDownload(req, res, rawText);
  if (sub === "payhip") return handlePayhip(req, res, rawText);
  if (sub === "rimborso") return handleRefund(req, res, rawText);
  if (sub === "contatto") return handleContact(req, res, rawText);

  return handleSupportGeneric(req, res, rawText);
};
