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
const router = require(path.join(process.cwd(), "app/modules/bot/core/router.bot.cjs"));

/* ============================================================
   AVATAR (NPC del videogioco)
============================================================ */
const vendor = require(path.join(process.cwd(), "app/modules/bot/bots/vendor.bot.cjs"));
const professor = require(path.join(process.cwd(), "app/modules/bot/bots/professore.bot.cjs"));
const influencer = require(path.join(process.cwd(), "app/modules/bot/bots/influencer.bot.cjs"));
const newsletter = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter.bot.cjs"));
const generic = require(path.join(process.cwd(), "app/modules/bot/bots/generic.bot.cjs"));

/* ============================================================
   UTILS (normalizzazione, keyword, logging)
============================================================ */
const utils = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   WHISPER (trascrizione vocale → testo)
============================================================ */
const transcribeAudio = require(path.join(process.cwd(), "app/modules/bot/whisper.cjs"));

/* ============================================================
   GAME ENGINE (UI JSON → frontend stile WhatsApp)
============================================================ */
let gameEngine = null;
try {
  gameEngine = require(path.join(process.cwd(), "app/modules/bot/game-engine.cjs"));
} catch {
  // Non esiste ancora, lo creeremo dopo
}

/* ============================================================
   MODULI ESTERNI (catalogo, faq, guides, memory, ai)
============================================================ */
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));
const faq = require(path.join(process.cwd(), "app/modules/faq.cjs"));
const guides = require(path.join(process.cwd(), "app/modules/guides.cjs"));
const memory = require(path.join(process.cwd(), "app/modules/memory.js"));
const ai = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

/* ============================================================
   1) detectIntent() — wrapper deterministico
============================================================ */
async function detectIntent(text, uid) {
  if (!text || typeof text !== "string") {
    return { intent: "generico" };
  }

  // 1) Intent Engine locale
  const localIntent = intentEngine.detect(text);

  // 2) Intent AI (fallback)
  const aiIntent = await ai.generateIntent(text, { uid });

  // Merge deterministico
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

  // Salva memoria
  memory.push(uid, text);

  // Router → avatar
  const avatar = router.pickAvatar(intentObj);

  // NPC → risposta
  const npc = {
    vendor,
    professor,
    influencer,
    newsletter,
    generic
  }[avatar] || generic;

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
  if (gameEngine) {
    return gameEngine.buildFrames(npcReply, avatar, uid);
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
  const intent = await detectIntent(message, context.uid);
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

  // moduli esterni
  catalogo,
  faq,
  guides,
  memory,
  ai
};
