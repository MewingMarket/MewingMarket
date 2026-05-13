// modules/utils.js — VERSIONE MAX 2027 (blindata, senza Payhip, senza slug)

/* =========================================================
   FUNZIONI DI SICUREZZA BASE
========================================================= */
function safeString(v) {
  return typeof v === "string" ? v : (v == null ? "" : String(v));
}

/* =========================================================
   TESTO PULITO
========================================================= */
function cleanText(value, fallback = "") {
  try {
    const out = safeString(value)
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "");

    return out || fallback;
  } catch (err) {
    console.error("cleanText error:", err);
    return fallback;
  }
}

/* =========================================================
   NUMERO PULITO
========================================================= */
function cleanNumber(value) {
  try {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

/* =========================================================
   URL VALIDO
========================================================= */
function cleanURL(value) {
  try {
    const url = safeString(value).trim();
    return url.startsWith("http") ? url : "";
  } catch {
    return "";
  }
}

/* =========================================================
   NORMALIZZAZIONE TESTO
========================================================= */
function normalize(text) {
  try {
    return safeString(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } catch (err) {
    console.error("normalize error:", err);
    return "";
  }
}

/* =========================================================
   MAX MODE — FUNZIONI AVANZATE
========================================================= */
function stripHTML(text) {
  try {
    return safeString(text).replace(/<[^>]*>/g, "").trim();
  } catch {
    return "";
  }
}

function safeText(text) {
  try {
    return stripHTML(text)
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim();
  } catch {
    return "";
  }
}

function shorten(text, max = 200) {
  try {
    const t = safeString(text);
    if (t.length <= max) return t;
    return t.substring(0, max - 3) + "...";
  } catch {
    return "";
  }
}

function extractLinks(text) {
  try {
    const regex = /(https?:\/\/[^\s]+)/gi;
    return safeString(text).match(regex) || [];
  } catch {
    return [];
  }
}

function isYouTubeLink(url) {
  try {
    return typeof url === "string" && (
      url.includes("youtube.com") ||
      url.includes("youtu.be")
    );
  } catch {
    return false;
  }
}

function formatPrice(value) {
  try {
    const n = cleanNumber(value);
    return n ? `${n}€` : "—";
  } catch {
    return "—";
  }
}

function cleanSearchQuery(text) {
  try {
    return normalize(stripHTML(text))
      .replace(/-/g, " ")
      .trim();
  } catch {
    return "";
  }
}

/* =========================================================
   EXPORT — VERSIONE PULITA 2027
========================================================= */
module.exports = {
  cleanText,
  cleanNumber,
  cleanURL,
  normalize,

  // MAX MODE
  stripHTML,
  safeText,
  shorten,
  extractLinks,
  isYouTubeLink,
  formatPrice,
  cleanSearchQuery
};
