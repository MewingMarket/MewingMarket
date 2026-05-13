/**
 * modules/bot/index.cjs
 * MAIN orchestrator — versione 2027
 * Espone Router AI + Bot specializzati + Utils + Whisper
 */

const path = require("path");

// Router AI
const router = require(path.join(process.cwd(), "app/modules/bot/core/router.bot.cjs"));

// Bot specializzati
const vendor = require(path.join(process.cwd(), "app/modules/bot/bots/vendor.bot.cjs"));
const professor = require(path.join(process.cwd(), "app/modules/bot/bots/professore.bot.cjs"));
const influencer = require(path.join(process.cwd(), "app/modules/bot/bots/influencer.bot.cjs"));
const newsletter = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter.bot.cjs"));
const generic = require(path.join(process.cwd(), "app/modules/bot/bots/generic.bot.cjs"));

// Utils bot
const utils = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Whisper (trascrizione audio)
const transcribeAudio = require(path.join(process.cwd(), "app/modules/bot/whisper.cjs"));

module.exports = {
  router,          // { routeMessage }
  vendor,
  professor,
  influencer,
  newsletter,
  generic,
  utils,
  transcribeAudio
};
