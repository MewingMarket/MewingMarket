/**
 * =========================================================
 * api.js — Versione 2027.902 (FIX DEFINITIVO)
 * - Scarta TUTTI i 404
 * - Scarta TUTTI gli HTML
 * - Accetta SOLO il primo 200 valido
 * - Nessun null, nessun {} fantasma
 * =========================================================
 */

console.log("🟦 api.js caricato (FIX DEFINITIVO)");

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
   1) API FETCH (VERSIONE FIXATA)
========================================================= */
window.apiFetch = async function(path, options = {}) {
  const prefixes = ["/api", "/api/v1", "/api/v2", "/api/latest", "/API"];

  for (const p of prefixes) {
    const url = p + path;

    try {
      const res = await fetch(url, { ...options, credentials: "include" });
      const text = await res.text();

      // HTML → SCARTATO
      if (text.trim().startsWith("<")) {
        throw new Error("HTML_RESPONSE");
      }

      // Se non è 200 → SCARTATO
      if (!res.ok) {
        throw new Error("BAD_STATUS");
      }

      // JSON valido → OK
      return new Response(text, {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      // prova il prossimo prefix
    }
  }

  // Nessun prefix valido
  return makeJsonResponse({ error: "API_FETCH_FAILED", path });
};

/* =========================================================
   2) FETCH CRITICO (VERSIONE FIXATA)
========================================================= */
window.fetchCritico = async function(path, options = {}, cfg = {}) {
  const { retries = 2, backoffMs = 200 } = cfg;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await window.apiFetch(path, options);

      // Se è un Response 200 → OK
      if (res && res.status === 200) {
        return res;
      }

      throw new Error("BAD_RESPONSE");

    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
      }
    }
  }

  return makeJsonResponse({ error: "FETCH_CRITICO_FAILED", path });
};
