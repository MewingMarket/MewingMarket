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
  gameEngine = require(path.join(process.cwd(), "app/modules/bot/game-engine.cjs"));
} catch {}

/* ============================================================
   MODULI ESTERNI
============================================================ */
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));
const faq = require(path.join(process.cwd(), "app/modules/faq.cjs"));
const guides = require(path.join(process.cwd(), "app/modules/guides.cjs"));
const memory = require(path.join(process.cwd(), "app/modules/memory.cjs"));
const ai = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

/* ============================================================
   1) detectIntent() — fusione deterministica
============================================================ */
async function detectIntent(text, uid) {
  if (!text || typeof text !== "string") {
    return { intent: "generico" };
  }

  const localIntent = intentEngine.detect(text);
  const aiIntent = await ai.generateIntent(text, { uid });

  return {
    intent: localIntent?.intent || aiIntent?.intent || "generico",
    ...localIntent,
    ...aiIntent
  };
}

/* ============================================================
   2) handleConversation() — orchestratore centrale
============================================================ */
async function handleConversation(reqOrIntent, text, uid, userState = {}) {
  let intentObj;

  // Caso 1: chiamato da chat.cjs → req
  if (typeof reqOrIntent === "object" && reqOrIntent.body) {
    const message = reqOrIntent.body.message || "";
    uid = reqOrIntent.uid;
    text = message;

    intentObj = await detectIntent(message, uid);
  }

  // Caso 2: chiamato da chat-voice.cjs → intent già pronto
  else {
    intentObj = reqOrIntent;
  }

  // Memoria
  memory.push(uid, text);

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
  const npcReply = await npc.run(text, {
    uid,
    intent: intentObj,
    userState,
    memory: memory.get(uid),
    catalogo,
    faq,
    guides,
    utils
  });

  // Game Engine → frames
  if (gameEngine && typeof gameEngine.runGame === "function") {
    return gameEngine.runGame(text, {
      uid,
      intent: intentObj,
      userState,
      memory: memory.get(uid),
      catalogo,
      faq,
      guides
    });
  }

  // Fallback → testo semplice
  return {
    reply: npcReply?.text || "Ok!",
    avatar
  };
}

/* ============================================================
   3) reply() — builder UI JSON (fallback)
============================================================ */
function reply(response) {
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
  const intent = await detectIntent(message, context.uid);
  const result = await handleConversation(intent, message, context.uid, context);
  return reply(result);
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
