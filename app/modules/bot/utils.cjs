/**
 * modules/bot/utils.cjs
 * Utility interne del bot — logging, reply, emoji, stato, UID
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
   BOT REPLY WRAPPER
   ============================================================ */
function reply(res, text) {
  try {
    log("BOT_REPLY", text);
    res.json({ reply: addEmojis(text || "") });
  } catch (err) {
    res.json({ reply: "Errore tecnico, ma posso aiutarti." });
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
   EXPORT
   ============================================================ */
module.exports = {
  log,
  reply,
  addEmojis,
  generateUID,
  setState,
  isYes
};
