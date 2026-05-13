/**
 * modules/bot/utils.cjs
 * Utility interne del bot — versione 2027
 * Compatibile con Router AI + Bot JSON
 */

const path = require("path");

// Utils generali del progetto
const { stripHTML } = require(path.join(process.cwd(), "app/modules/utils.cjs"));

/* ============================================================
   LOG ENGINE — logging totale
============================================================ */
function log(section, data) {
  try {
    const formatted =
      typeof data === "object" ? JSON.stringify(data, null, 2) : data;
    console.log(`[MM-BOT][${section}]`, formatted);
  } catch (err) {
    console.error("[MM-BOT][LOG_ERROR]", err?.message || err);
  }
}

/* ============================================================
   NORMALIZZAZIONE TESTO (PATCH)
============================================================ */
function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   CLEAN SEARCH QUERY (PATCH)
============================================================ */
function cleanSearchQuery(text = "") {
  return normalize(text)
    .replace(/\b(il|lo|la|i|gli|le|un|una|di|da|per|con|su|che|come)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   KEYWORD EXTRACTOR
============================================================ */
function extractKeywords(text = "") {
  const t = cleanSearchQuery(text);
  return t.split(" ").filter(w => w.length > 2);
}

/* ============================================================
   UID GENERATOR
============================================================ */
function generateUID() {
  const uid = "mm_" + Math.random().toString(36).substring(2, 12);
  log("UID_GENERATED", uid);
  return uid;
}

/* ============================================================
   YES DETECTOR
============================================================ */
function isYes(text) {
  const t = (text || "").toLowerCase();
  return (
    t.includes("si") ||
    t.includes("sì") ||
    t.includes("ok") ||
    t.includes("va bene") ||
    t.includes("certo") ||
    t.includes("yes")
  );
}

/* ============================================================
   STATE MANAGER (compatibile con bot)
============================================================ */
function setState(req, newState) {
  try {
    const old = req?.userState?.state || "none";
    log("STATE_CHANGE", { old, new: newState });
    if (req.userState) req.userState.state = newState;
  } catch (err) {
    log("STATE_ERROR", err);
  }
}

/* ============================================================
   EXPORT — versione pulita per Router AI + Bot
============================================================ */
module.exports = {
  log,
  normalize,
  cleanSearchQuery,
  extractKeywords,
  generateUID,
  isYes,
  setState
};
