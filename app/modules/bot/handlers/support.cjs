/**
 * modules/bot/handlers/support.cjs
 * Supporto completo: FAQ, Guide, Registrazione, Login, Download, Ordini, PayPal, Rimborso
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

// Moduli dinamici
const FAQ = require("../../faq.cjs");
const Guides = require("../../guides.cjs");

/* ============================================================
   SUPPORTO GENERICO
============================================================ */
async function handleSupportGeneric(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "supporto", null);

  // 🔥 Ricerca automatica FAQ + Guide
  const faqMatch = FAQ.search(rawText);
  const guideMatch = Guides.search(rawText);

  if (faqMatch) {
    return reply(res, FAQ.render(faqMatch));
  }

  if (guideMatch) {
    return reply(res, Guides.render(guideMatch));
  }

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Supporto</div>
  <div class="mm-card-body">
    Posso aiutarti con:<br>
    • Login / Registrazione<br>
    • Download prodotti<br>
    • Ordini e rimborsi<br>
    • Pagamenti PayPal<br>
    • FAQ e Guide<br><br>
    Dimmi cosa ti serve.
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Supporto generico",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più rassicurante e professionale."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   LOGIN / REGISTRAZIONE / PASSWORD
============================================================ */
async function handleLogin(req, res) {
  return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">Accesso al tuo account</div>
  <div class="mm-card-body">
    Per accedere vai qui:<br>
    <a href="login.html">login.html</a><br><br>
    Se hai dimenticato la password:<br>
    <a href="reset.html">reset.html</a>
  </div>
</div>
`);
}

async function handleRegistrazione(req, res) {
  return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">Creazione account</div>
  <div class="mm-card-body">
    Per registrarti vai qui:<br>
    <a href="registrazione.html">registrazione.html</a><br><br>
    Dopo la registrazione potrai accedere alla dashboard.
  </div>
</div>
`);
}

async function handlePasswordReset(req, res) {
  return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">Recupero password</div>
  <div class="mm-card-body">
    Per recuperare la password vai qui:<br>
    <a href="reset.html">reset.html</a><br><br>
    Ti invieremo una email con il link di ripristino.
  </div>
</div>
`);
}

/* ============================================================
   ORDINI
============================================================ */
async function handleOrdini(req, res) {
  return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">I tuoi ordini</div>
  <div class="mm-card-body">
    Puoi vedere i tuoi ordini nella dashboard:<br>
    <a href="dashboard.html">dashboard.html</a><br><br>
    Se hai problemi con un ordine, posso aiutarti.
  </div>
</div>
`);
}

/* ============================================================
   DOWNLOAD
============================================================ */
async function handleDownload(req, res) {
  return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">Problemi di download</div>
  <div class="mm-card-body">
    Dopo l'acquisto ricevi una email con il link di download.<br><br>
    Se non la trovi:<br>
    • Controlla Spam<br>
    • Controlla Promozioni<br>
    • Controlla Posta indesiderata<br><br>
    Se vuoi, posso aiutarti a recuperare il link.
  </div>
</div>
`);
}

/* ============================================================
   PAGAMENTI / PAYPAL
============================================================ */
async function handlePagamento(req, res) {
  return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">Pagamenti e PayPal</div>
  <div class="mm-card-body">
    I pagamenti sono gestiti tramite PayPal.<br><br>
    Se hai problemi con una transazione, posso aiutarti a capire cosa è successo.
  </div>
</div>
`);
}

/* ============================================================
   RIMBORSO
============================================================ */
async function handleRefund(req, res) {
  return reply(res, `
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
`);
}

/* ============================================================
   CONTATTI
============================================================ */
async function handleContact(req, res) {
  return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">Contatti</div>
  <div class="mm-card-body">
    Puoi contattarci qui:<br>
    <b>supporto@mewingmarket.it</b><br><br>
    Rispondiamo entro 24 ore.
  </div>
</div>
`);
}

/* ============================================================
   ROUTER INTERNO
============================================================ */
module.exports = function supportHandler(req, res, sub, rawText) {
  log("HANDLER_SUPPORT", { sub, rawText });

  if (sub === "download") return handleDownload(req, res, rawText);
  if (sub === "payhip") return handlePagamento(req, res, rawText);
  if (sub === "rimborso") return handleRefund(req, res, rawText);
  if (sub === "contatto") return handleContact(req, res, rawText);

  // Intent aggiuntivi
  if (sub === "login") return handleLogin(req, res);
  if (sub === "registrazione") return handleRegistrazione(req, res);
  if (sub === "password_reset") return handlePasswordReset(req, res);
  if (sub === "ordini") return handleOrdini(req, res);

  return handleSupportGeneric(req, res, rawText);
};
