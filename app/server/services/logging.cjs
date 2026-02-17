/**
 * app/server/services/logging.cjs
 * Logging server-side + logging bot
 */

const SERVER_LOGS = [];

/* =========================================================
   LOG EVENTI GENERICI
========================================================= */
function logEvent(event, data = {}) {
  try {
    SERVER_LOGS.push({
      time: new Date().toISOString(),
      event,
      data
    });

    if (SERVER_LOGS.length > 500) SERVER_LOGS.shift();
  } catch (err) {
    console.error("LogEvent error:", err?.message || err);
  }
}

/* =========================================================
   LOGGING PREMIUM — BRIDGE BOT ↔ SERVER
========================================================= */
function logBot(event, data = {}) {
  try {
    console.log(
      `[MM-BOT-SERVER][${event}]`,
      typeof data === "object" ? JSON.stringify(data) : data
    );

    logEvent(event, data);
  } catch (err) {
    console.error("logBot error:", err?.message || err);
  }
}

/* =========================================================
   ESPORTAZIONE + GLOBAL
========================================================= */
global.logEvent = logEvent;
global.logBot = logBot;

module.exports = {
  logEvent,
  logBot,
  SERVER_LOGS
};
