/**
 * modules/bot/handlers/social.cjs
 * Gestione social generici + social specifici
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

/* ============================================================
   LINK SOCIAL
   ============================================================ */
const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/mewingmarket",
  tiktok: "https://www.tiktok.com/@mewingmarket",
  youtube: "https://www.youtube.com/@mewingmarket2",
  facebook: "https://www.facebook.com/profile.php?id=61584779793628",
  x: "https://x.com/mewingm8",
  threads: "https://www.threads.net/@mewingmarket",
  linkedin: "https://www.linkedin.com/company/mewingmarket"
};

/* ============================================================
   SOCIAL SPECIFICO
   ============================================================ */
async function handleSpecificSocial(req, res, sub, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const link = SOCIAL_LINKS[sub];

  if (!link) {
    return reply(res, "Non trovo questo social, vuoi vedere la lista completa?");
  }

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Profilo ${sub}</div>
  <div class="mm-card-body">
    <a href="${link}">${link}</a><br><br>
    Vuoi vedere anche gli altri social?
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Mostra social " + sub,
    Memory.get(uid),
    pageContext,
    "\nAggiungi una frase che spieghi cosa trova l’utente su questo social."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   SOCIAL GENERICO
   ============================================================ */
async function handleGenericSocial(req, res, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const base = `
<div class="mm-card">
  <div class="mm-card-title">I nostri social 📲</div>
  <div class="mm-card-body">
    Instagram<br>
    TikTok<br>
    YouTube<br>
    Facebook<br>
    X<br>
    Threads<br>
    LinkedIn<br><br>
    Vuoi tornare al menu o vedere il catalogo?
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Mostra social generici",
    Memory.get(uid),
    pageContext,
    "\nAggiungi una frase che inviti a seguirci."
  );

  return reply(res, enriched || base);
}

/* ============================================================
   ROUTER INTERNO
   ============================================================ */
module.exports = function socialHandler(req, res, intent, sub, rawText) {
  log("HANDLER_SOCIAL", { intent, sub, rawText });

  if (intent === "social_specifico") {
    return handleSpecificSocial(req, res, sub, rawText);
  }

  return handleGenericSocial(req, res, rawText);
};
