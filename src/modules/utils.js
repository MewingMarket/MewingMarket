
// modules/utils.js

// Slug sicuro
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

// Testo pulito
function cleanText(value, fallback = "") {
  return (value || "")
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "")
    || fallback;
}

// Numero pulito
function cleanNumber(value) {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

// URL valido
function cleanURL(value) {
  const url = (value || "").toString().trim();
  return url.startsWith("http") ? url : "";
}

// Normalizzazione testo
function normalize(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = {
  safeSlug,
  cleanText,
  cleanNumber,
  cleanURL,
  normalize
};
