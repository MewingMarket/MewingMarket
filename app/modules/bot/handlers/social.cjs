/**
 * modules/bot/handlers/social.cjs — VERSIONE 2027
 * Social Helper — usato da Influencer AI
 * Nessun HTML, nessun GPT, solo JSON UI
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   LINK SOCIAL UFFICIALI
============================================================ */
const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/mewingmarket",
  tiktok: "https://www.tiktok.com/@mewingmarket",
  youtube: "https://www.youtube.com/@mewingmarket2",
  facebook: "https://www.facebook.com/profile.php?id=61584779793628",
  threads: "https://www.threads.net/@mewingmarket",
  linkedin: "https://www.linkedin.com/company/mewingmarket"
};

/* ============================================================
   SOCIAL SPECIFICO
============================================================ */
function socialSpecific(platform) {
  log("SOCIAL_SPECIFIC", platform);

  const link = SOCIAL_LINKS[platform];

  if (!link) {
    return {
      type: "text",
      avatar: "influencer_ai",
      text: "Non trovo questo social. Vuoi vedere la lista completa?"
    };
  }

  return {
    type: "card",
    avatar: "influencer_ai",
    layout: "social_profile",
    title: `Profilo ${platform}`,
    link,
    actions: [
      { label: "Mostra tutti i social", value: "social" }
    ]
  };
}

/* ============================================================
   SOCIAL GENERICO
============================================================ */
function socialGeneric() {
  log("SOCIAL_GENERIC");

  return {
    type: "list",
    avatar: "influencer_ai",
    title: "I nostri social",
    items: Object.keys(SOCIAL_LINKS).map(key => ({
      label: key,
      value: `social_${key}`,
      link: SOCIAL_LINKS[key]
    })),
    actions: [
      { label: "Torna al menu", value: "menu" }
    ]
  };
}

/* ============================================================
   EXPORT — usato da Influencer AI
============================================================ */
module.exports = {
  socialSpecific,
  socialGeneric
};
