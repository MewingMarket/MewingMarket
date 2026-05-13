/**
 * modules/bot/index.cjs — VERSIONE VIDEOGIOCO 2027
 * MAIN orchestrator del sistema BOT
 * Espone:
 * - Intent Engine (locale, NO GPT)
 * - Router AI (smistamento avatar)
 * - Avatar (Vendor, Professore, Influencer, Newsletter, Generico)
 * - Utils (normalizzazione, keyword, ecc.)
 * - Whisper (trascrizione vocale)
 * - Game Engine (UI JSON → frontend stile WhatsApp)
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
   — lo aggiungeremo dopo
============================================================ */
let gameEngine = null;
try {
  gameEngine = require(path.join(process.cwd(), "app/modules/bot/game-engine.cjs"));
} catch {
  // Non esiste ancora, lo creeremo dopo
}

/* ============================================================
   EXPORT — orchestratore completo
============================================================ */
module.exports = {
  intentEngine,   // nuovo cervello
  router,         // smistamento avatar
  vendor,
  professor,
  influencer,
  newsletter,
  generic,
  utils,
  transcribeAudio,
  gameEngine       // arriverà dopo
};
