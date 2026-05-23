/**
 * modules/bot/index.cjs — VERSIONE VIDEOGIOCO 2027 (PATCH COMPLETA)
 * Orchestratore BOT + Intent Engine + Router + NPC + Game Engine
 */

const path = require("path");

/* ============================================================
   INTENT ENGINE (locale, deterministico)
============================================================ */
const intentEngine = require(path.join(process.cwd(), "app/modules/bot/intent-engine.cjs"));

/* ============================================================
   ROUTER AI (decide quale avatar risponde)
============================================================ */
const router = require(path.join(process.cwd(), "app/modules/bot/core/router.cjs"));

/* ============================================================
   AVATAR (NPC del videogioco)
============================================================ */
const vendor = require(path.join(process.cwd(), "app/modules/bot/bots/vendor-bot.cjs"));
const professor = require(path.join(process.cwd(), "app/modules/bot/bots/professore-bot.cjs"));
const influencer = require(path.join(process.cwd(), "app/modules/bot/bots/influencer-bot.cjs"));
const newsletter = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter-bot.cjs"));
const generic = require(path.join(process.cwd(), "app/modules/bot/bots/generic-bot.cjs"));

/* ============================================================
   UTILS
============================================================ */
const utils = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   WHISPER (trascrizione vocale)
============================================================ */
const transcribeAudio = require(path.join(process.cwd(), "app/modules/bot/whisper.cjs"));

/* ============================================================
   GAME ENGINE (UI JSON → frontend)
============================================================ */
let gameEngine = null;
try {
  // nel repo reale è gameEngine.cjs, non game-engine.cjs
  gameEngine = require(path.join(process.cwd(), "app/modules/bot/gameEngine.cjs"));
} catch {}

/* ============================================================
   MODULI ESTERNI
============================================================ */
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));
const faq = require(path.join(process.cwd(), "app/modules/faq.cjs"));
const guides = require(path.join(process.cwd(), "app/modules/guides.cjs"));
const memory = require(path.join(process.cwd(), "app/modules/memory.cjs"));
const ai = require(path.join(process.cwd(), "app/server/modules/ai.cjs")); // tenuto per eventuali usi futuri, ma NON per intent

/* ============================================================
   1) detectIntent() — usa SOLO intent-engine locale
============================================================ */
async function detectIntent(text, uid, options = {}) {
  if (!text || typeof text !== "string") {
    return {
      raw: "",
      intent: "generico",
      subintent: null,
      avatar: "assistant",
      botOwner: "assistant",
      productId: null,
      rawProduct: null,
      category: null,
      keywords: [],
      confidence: 1,
      source: "local"
    };
  }

  // unica fonte di verità: generateIntent del nuovo intent-engine
  const intentObj = await intentEngine.generateIntent(text, {
    uid,
    gender: options.gender,
    botAvatar: options.botAvatar
  });

  return intentObj;
}

/* ============================================================
   2) handleConversation() — orchestratore centrale
   Compatibile sia con:
   - chat.cjs → handleConversation(req)
   - chat-voice.cjs → handleConversation(intentObj, text, uid, userState)
============================================================ */
async function handleConversation(reqOrIntent, text, uid, userState = {}) {
  let intentObj;
  let message = text;

  // Caso 1: chiamato da chat.cjs → req
  if (typeof reqOrIntent === "object" && reqOrIntent.body) {
    const req = reqOrIntent;
    message = req.body?.message || "";
    uid = req.uid;
    const botAvatar = req.body?.bot || "generic";
    const gender = req.body?.gender || "male";

    intentObj = await detectIntent(message, uid, { botAvatar, gender });
  }

  // Caso 2: chiamato da chat-voice.cjs → intent già pronto
  else {
    intentObj = reqOrIntent || {};
    message = text || intentObj.raw || "";
  }

  // Memoria
  if (uid) {
    memory.push(uid, message);
  }

  // Router → avatar
  const avatar = router.pickAvatar(intentObj);

  // NPC selezionato
  const npc = {
    vendor,
    professor,
    influencer,
    newsletter,
    generic
  }[avatar] || generic;

  // Risposta NPC
  const npcReply = await npc.run(message, {
    uid,
    intent: intentObj,
    userState,
    memory: uid ? memory.get(uid) : [],
    catalogo,
    faq,
    guides,
    utils
  });

  // Game Engine → frames (se presente)
  if (gameEngine && typeof gameEngine.runGame === "function") {
    return gameEngine.runGame(message, {
      uid,
      intent: intentObj,
      userState,
      memory: uid ? memory.get(uid) : [],
      catalogo,
      faq,
      guides
    });
  }

  // Fallback → risposta semplice
  return {
    reply: npcReply?.text || npcReply?.reply || "Ok!",
    avatar
  };
}

/* ============================================================
   3) reply() — builder UI JSON (compatibile con chat-voice)
============================================================ */
function reply(response, uid) {
  if (response?.frames) return response;

  return {
    frames: [
      {
        type: "text",
        text: response?.reply || "Ok!"
      }
    ]
  };
}

/* ============================================================
   4) runGame() — wrapper ufficiale
============================================================ */
async function runGame(message, context = {}) {
  const intent = await detectIntent(message, context.uid, {
    botAvatar: context.botAvatar,
    gender: context.gender
  });

  const result = await handleConversation(intent, message, context.uid, context);
  return reply(result, context.uid);
}

/* ============================================================
   EXPORT — orchestratore completo
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
  transcribeAudio,
  gameEngine,

  detectIntent,
  handleConversation,
  reply,
  runGame,

  catalogo,
  faq,
  guides,
  memory,
  ai
};
