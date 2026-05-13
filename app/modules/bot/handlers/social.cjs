/**
 * modules/bot/handlers/social.cjs — VERSIONE VIDEOGIOCO 2027
 * Social Helper — Influencer AI
 * Nessun HTML, nessun GPT, solo JSON UI compatibile con Game Engine
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
   SOCIAL SPECIFICO (profilo singolo)
============================================================ */
function socialSpecific(platform) {
  log("SOCIAL_SPECIFIC", platform);

  const link = SOCIAL_LINKS[platform];

  if (!link) {
    return {
      type: "text",
      avatar: "influencer",
      text: "Non trovo questo social. Vuoi vedere la lista completa?"
    };
  }

  return {
    type: "card",
    avatar: "influencer",
    layout: "social_profile",
    title: `Profilo ${platform}`,
    link,
    actions: [
      { label: "Mostra tutti i social", intent: "social_list" }
    ]
  };
}

/* ============================================================
   SOCIAL GENERICO (lista completa)
============================================================ */
function socialGeneric() {
  log("SOCIAL_GENERIC");

  return {
    type: "list",
    avatar: "influencer",
    title: "I nostri social",
    items: Object.keys(SOCIAL_LINKS).map(key => ({
      label: key,
      intent: "social_specific",
      platform: key,
      link: SOCIAL_LINKS[key]
    })),
    actions: [
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   SOCIAL VIDEO CARD (TV + animazione)
============================================================ */
function socialVideo(platform) {
  const link = SOCIAL_LINKS[platform];

  if (!link) {
    return {
      type: "text",
      avatar: "influencer",
      text: "Non trovo il video per questo social."
    };
  }

  return {
    type: "tutorial_card",
    avatar: "influencer",
    title: `Video su ${platform}`,
    steps: [
      "Guarda il video direttamente dalla TV",
      "Segui il creator",
      "Scopri i contenuti esclusivi"
    ],
    actions: [
      {
        label: "Guarda il video",
        type: "open_video",
        video_url: link
      }
    ]
  };
}

/* ============================================================
   EXPORT — Influencer AI
============================================================ */
module.exports = {
  socialSpecific,
  socialGeneric,
  socialVideo
};
