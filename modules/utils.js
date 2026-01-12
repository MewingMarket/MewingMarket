// modules/utils.js

// Normalizza testo per confronti e ricerca
function normalize(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
    .replace(/[^a-z0-9 ]/g, " ")     // rimuove simboli strani
    .replace(/\s+/g, " ")            // spazi multipli
    .trim();
}

// Slug sicuro
function safeSlug(str) {
  if (!str) return "";
  return normalize(str)
    .replace(/ /g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .trim();
}

// Testo pulito con fallback
function cleanText(value, fallback = "") {
  if (!value || typeof value !== "string") return fallback;
  return value.trim();
}

// Numero pulito
function cleanNumber(value) {
  if (!value) return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

// URL pulito
function cleanURL(url) {
  if (!url || typeof url !== "string") return "";
  if (!url.startsWith("http")) return "";
  return url.trim();
}

module.exports = {
  normalize,
  safeSlug,
  cleanText,
  cleanNumber,
  cleanURL
};
