// modules/utils.js — VERSIONE MAX

// ---------------------------------------------
// SLUG SICURO
// ---------------------------------------------
function safeSlug(text) {
  return (text || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "prodotto-" + Date.now();
}

// ---------------------------------------------
// TESTO PULITO
// ---------------------------------------------
function cleanText(value, fallback = "") {
  return (value || "")
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "")
    || fallback;
}

// ---------------------------------------------
// NUMERO PULITO
// ---------------------------------------------
function cleanNumber(value) {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

// ---------------------------------------------
// URL VALIDO
// ---------------------------------------------
function cleanURL(value) {
  const url = (value || "").toString().trim();
  return url.startsWith("http") ? url : "";
}

// ---------------------------------------------
// NORMALIZZAZIONE TESTO
// ---------------------------------------------
function normalize(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------
// ⭐ NUOVE FUNZIONI MAX MODE
// ---------------------------------------------

// Rimuove HTML indesiderato
function stripHTML(text) {
  return (text || "").replace(/<[^>]*>/g, "").trim();
}

// Sanitizzazione avanzata per GPT
function safeText(text) {
  return stripHTML(text)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

// Accorcia testo lungo mantenendo senso
function shorten(text, max = 200) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.substring(0, max - 3) + "...";
}

// Estrae link da un testo
function extractLinks(text) {
  const regex = /(https?:\/\/[^\s]+)/gi;
  return (text.match(regex) || []);
}

// Estrae slug da URL o testo
function extractSlug(text) {
  if (!text) return "";
  const parts = text.split("/");
  return safeSlug(parts.pop());
}

// Riconosce link Payhip
function isPayhipLink(url) {
  return typeof url === "string" && url.includes("payhip.com");
}

// Riconosce link YouTube
function isYouTubeLink(url) {
  return typeof url === "string" && (
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  );
}

// Formatta prezzo
function formatPrice(value) {
  const n = cleanNumber(value);
  return n ? `${n}€` : "—";
}

// Pulisce query di ricerca
function cleanSearchQuery(text) {
  return normalize(stripHTML(text))
    .replace(/-/g, " ")
    .trim();
}

module.exports = {
  safeSlug,
  cleanText,
  cleanNumber,
  cleanURL,
  normalize,

  // MAX MODE
  stripHTML,
  safeText,
  shorten,
  extractLinks,
  extractSlug,
  isPayhipLink,
  isYouTubeLink,
  formatPrice,
  cleanSearchQuery
};
