/**
 * =========================================================
 * api.js — Versione 2027.900 (FIREWALL UNIVERSALE)
 * - fetchNormale → apiFetch → fetchCritico
 * - Normalizzazione HTML → JSON
 * - Nessun ritorno vuoto
 * - Nessun errore non gestito
 * =========================================================
 */

console.log("🟦 api.js caricato (FIREWALL)");

/* =========================================================
   0) Normalizzatore HTML → JSON
========================================================= */
function normalizeToJson(text, status = 500) {
  if (!text) return { error: "EMPTY_RESPONSE", status };

  const trimmed = text.trim();

  // Se è già JSON valido → parse
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      return { error: "INVALID_JSON", raw: trimmed, status };
    }
  }

  // Se è HTML → converti
  if (trimmed.startsWith("<")) {
    return {
      error: "HTML_RESPONSE",
      html: trimmed.slice(0, 500),
      status
    };
  }

  // Fallback
  return { error: "UNKNOWN_FORMAT", raw: trimmed, status };
}

/* =========================================================
   1) FETCH NORMALE
========================================================= */
async function fetchNormale(path, options = {}) {
  try {
    const res = await fetch(path, { ...options, credentials: "include" });
    const text = await res.text();
    return normalizeToJson(text, res.status);
  } catch (e) {
    return { error: "FETCH_ERROR", details: e.toString() };
  }
}

/* =========================================================
   2) API FETCH (PATCHATO)
========================================================= */
window.apiFetch = async function(path, options = {}) {
  const prefixes = ["/api/v1", "/api/v2", "/api/latest", "/api", "/API"];

  for (const p of prefixes) {
    const url = p + path;
    try {
      const res = await fetch(url, { ...options, credentials: "include" });
      const text = await res.text();
      const json = normalizeToJson(text, res.status);

      if (!json.error) return json;
    } catch (e) {}
  }

  return { error: "API_FETCH_FAILED", path };
};

/* =========================================================
   3) FETCH CRITICO (PATCHATO)
========================================================= */
window.fetchCritico = async function(path, options = {}, cfg = {}) {
  const { retries = 2, backoffMs = 200 } = cfg;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const json = await window.apiFetch(path, options);
      if (!json.error) return json;

      if (attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
      }
    } catch (e) {}
  }

  return { error: "FETCH_CRITICO_FAILED", path };
};

/* =========================================================
   4) FETCH UNIVERSALE — IL VERO FIREWALL
========================================================= */
window.api = async function(path, options = {}) {
  // 1) fetch normale
  const normal = await fetchNormale(path, options);
  if (!normal.error) return normal;

  // 2) apiFetch
  const api = await window.apiFetch(path, options);
  if (!api.error) return api;

  // 3) fetchCritico
  const crit = await window.fetchCritico(path, options);
  return crit;
};
