/**
 * modules/bot/utils.cjs
 * Utility interne del bot — logging, reply, emoji, stato, UID
 * + PATCH: normalizzazione avanzata, ricerca, sicurezza GPT
 */

const { stripHTML } = require("../utils.cjs"); // usa il tuo utils generale

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
   EMOJI BOOSTER
============================================================ */
function addEmojis(text = "") {
  log("EMOJI_IN", text);
  try {
    if (!text || typeof text !== "string") return text || "";
    const out = text
      .replace(/\bciao\b/gi, "ciao 👋")
      .replace(/\bgrazie\b/gi, "grazie 🙏")
      .replace(/\bok\b/gi, "ok 👍")
      .replace(/\bperfetto\b/gi, "perfetto 😎")
      .replace(/\bottimo\b/gi, "ottimo 🔥")
      .replace(/\bscusa\b/gi, "scusa 😅");

    log("EMOJI_OUT", out);
    return out;
  } catch (err) {
    log("EMOJI_ERROR", err);
    return text;
  }
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
   STATE MANAGER
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
   BOT REPLY WRAPPER (VERSIONE RESILIENTE)
============================================================ */
function reply(res, text) {
  try {
    log("BOT_REPLY", text);

    const payload = { reply: addEmojis(text || "") };

    if (res && typeof res.json === "function") {
      return res.json(payload);
    }

    return payload;

  } catch (err) {
    log("BOT_REPLY_ERROR", err);

    const fallback = {
      reply: "C’è un piccolo problema tecnico, ma posso aiutarti."
    };

    if (res && typeof res.json === "function") {
      return res.json(fallback);
    }

    return fallback;
  }
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
   KEYWORD EXTRACTOR (PATCH)
============================================================ */
function extractKeywords(text = "") {
  const t = cleanSearchQuery(text);
  return t.split(" ").filter(w => w.length > 2);
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  log,
  reply,
  addEmojis,
  generateUID,
  setState,
  isYes,
  normalize,
  cleanSearchQuery,
  extractKeywords
};
