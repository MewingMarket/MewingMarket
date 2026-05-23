/**
 * modules/bot/index.cjs — VERSIONE VIDEOGIOCO 2027.4 (PATCH COMPLETA)
 * Orchestratore BOT + Intent Engine + Router + NPC + Sidekick + Mission Engine
 */

const path = require("path");

/* ============================================================
   INTENT ENGINE 2027.4
============================================================ */
const intentEngine = require(path.join(process.cwd(), "app/modules/bot/intent-engine.cjs"));

/* ============================================================
   ROUTER AI 2027.4
============================================================ */
const router = require(path.join(process.cwd(), "app/modules/bot/core/router.cjs"));

/* ============================================================
   NPC (BOT)
============================================================ */
const vendor = require(path.join(process.cwd(), "app/modules/bot/bots/vendor-bot.cjs"));
const professor = require(path.join(process.cwd(), "app/modules/bot/bots/professore-bot.cjs"));
const influencer = require(path.join(process.cwd(), "app/modules/bot/bots/influencer-bot.cjs"));
const newsletter = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter-bot.cjs"));
const generic = require(path.join(process.cwd(), "app/modules/bot/bots/generic-bot.cjs"));

/* ============================================================
   MISSION ENGINE
============================================================ */
const missionEngine = require(path.join(process.cwd(), "app/modules/game/mission-engine.cjs"));

/* ============================================================
   UTILS + MEMORIA
============================================================ */
const utils = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const memory = require(path.join(process.cwd(), "app/modules/memory.cjs"));

/* ============================================================
   DATI ESTERNI
============================================================ */
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));
const faq = require(path.join(process.cwd(), "app/modules/faq.cjs"));
const guides = require(path.join(process.cwd(), "app/modules/guides.cjs"));

/* ============================================================
   1) detectIntent() — Intent Engine 2027.4
============================================================ */
async function detectIntent(text, uid, options = {}) {
  if (!text || typeof text !== "string") {
    return {
      raw: "",
      intent: "generico",
      avatar: "generic",
      botOwner: "generic",
      productId: null,
      rawProduct: null,
      category: null,
      keywords: [],
      confidence: 1,
      source: "local"
    };
  }

  return intentEngine.generateIntent(text, {
    uid,
    gender: options.gender,
    botAvatar: options.botAvatar
  });
}

/* ============================================================
   2) handleConversation() — orchestratore centrale 2027.4
============================================================ */
async function handleConversation(req) {
  const uid = req.uid;
  const message = req.body?.message || "";
  const botAvatar = req.body?.bot || "generic";
  const gender = req.body?.gender || "male";

  /* 1) Intent Engine */
  const intentObj = await detectIntent(message, uid, { botAvatar, gender });

  /* 2) Memoria */
  if (uid) memory.push(uid, message);

  /* 3) Router → avatar */
  const avatar = router.pickAvatar(intentObj);

  /* 4) NPC selezionato */
  const npc = { vendor, professor, influencer, newsletter, generic }[avatar] || generic;

  /* 5) Risposta NPC */
  const npcReply = await npc.run(message, {
    uid,
    intent: intentObj,
    gender,
    memory: uid ? memory.get(uid) : [],
    catalogo,
    faq,
    guides,
    utils
  });

  /* 6) Sidekick */
  const sidekickReply = await router.runSidekick(avatar, message, {
    uid,
    intent: intentObj,
    catalogo
  });

  /* 7) Mission Engine */
  const missionResult = await missionEngine.processEvent({
    uid,
    intent: intentObj.intent,
    botAvatar: avatar
  });

  /* 8) Normalizzazione risposta */
  const final = {
    avatar,
    type: npcReply.type || "text",
    ...npcReply
  };

  if (sidekickReply) {
    final.sidekick = sidekickReply;
  }

  if (missionResult) {
    final.mission = missionResult;
  }

  return final;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  intentEngine,
  router,
  vendor,
  professor,
  influencer,
  newsletter,
  generic,
  utils,
  memory,

  detectIntent,
  handleConversation,

  catalogo,
  faq,
  guides
};
