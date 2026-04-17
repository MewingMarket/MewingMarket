/**
 * =========================================================
 * api.js — Versione 2027.901 (FIREWALL COMPATIBILE)
 * - Mantiene Response come output (compatibile con res.json())
 * - Normalizza HTML → JSON
 * - Normalizza errori → JSON
 * - Nessun {} fantasma
 * =========================================================
 */

console.log("🟦 api.js caricato (FIREWALL COMPATIBILE)");

/* =========================================================
   0) Crea un Response JSON valido da qualsiasi input
========================================================= */
function makeJsonResponse(obj, status = 500) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

/* =========================================================
   1) API FETCH (PATCHATO)
========================================================= */
window.apiFetch = async function(path, options = {}) {
  const prefixes = ["/api/v1", "/api/v2", "/api/latest", "/api", "/API"];

  for (const p of prefixes) {
    const url = p + path;

    try {
      const res = await fetch(url, { ...options, credentials: "include" });
      const text = await res.text();

      // HTML → JSON
      if (text.trim().startsWith("<")) {
        return makeJsonResponse({
          error: "HTML_RESPONSE",
          url,
          html: text.slice(0, 500)
        }, res.status);
      }

      // JSON valido
      return new Response(text, {
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      // continua al prossimo prefix
    }
  }

  return makeJsonResponse({ error: "API_FETCH_FAILED", path });
};

/* =========================================================
   2) FETCH CRITICO (PATCHATO)
========================================================= */
window.fetchCritico = async function(path, options = {}, cfg = {}) {
  const { retries = 2, backoffMs = 200 } = cfg;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await window.apiFetch(path, options);

      // se è JSON valido → OK
      return res;

    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
      }
    }
  }

  return makeJsonResponse({ error: "FETCH_CRITICO_FAILED", path });
};
