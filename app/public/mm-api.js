/**
 * =========================================================
 * mm-api.js — Versione 2027.904 (FUNZIONI + FALLBACK REALI)
 * - Scarta 404, HTML, {}, risposte vuote
 * - Accetta SOLO JSON pieno
 * - Fallback: fetchNormale → apiFetch → fetchCritico
 * - Fallback per FUNZIONE, non per route
 * =========================================================
 */

console.log("🟦 mm-api.js caricato (FUNZIONI + FALLBACK DEFINITIVO)");

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
   1) FETCH NORMALE
========================================================= */
window.fetchNormale = async function(path, options = {}) {
  return fetch(path, options);
};

/* =========================================================
   2) API FETCH (multi-prefix)
========================================================= */
window.apiFetch = async function(path, options = {}) {
  const prefixes = ["/api", "/api/v1", "/api/v2", "/api/latest", "/API"];

  for (const p of prefixes) {
    const url = p + path;

    try {
      const res = await fetch(url, { ...options, credentials: "include" });
      const text = await res.text();

      if (text.trim().startsWith("<")) continue;
      if (!res.ok) continue;
      if (!text || text.trim() === "{}") continue;

      return new Response(text, {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {}
  }

  return makeJsonResponse({ error: "API_FETCH_FAILED", path });
};

/* =========================================================
   3) FETCH CRITICO (retry)
========================================================= */
window.fetchCritico = async function(path, options = {}, cfg = {}) {
  const { retries = 2, backoffMs = 200 } = cfg;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await window.apiFetch(path, options);

      if (res && res.status === 200) return res;

    } catch (err) {}

    await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
  }

  return makeJsonResponse({ error: "FETCH_CRITICO_FAILED", path });
};

/* =========================================================
   4) FETCH UNIVERSALE (fallback chain)
========================================================= */
window.fetchUniversale = async function(path, options = {}, cfg = {}) {

  // 1) fetch normale
  try {
    const res = await window.fetchNormale(path, options);
    const text = await res.text();
    if (res.ok && text && text.trim() !== "{}" && !text.trim().startsWith("<")) {
      return new Response(text, { status: 200, headers: { "Content-Type": "application/json" } });
    }
  } catch (e) {}

  // 2) apiFetch
  try {
    const res = await window.apiFetch(path, options);
    const text = await res.text();
    if (res.ok && text && text.trim() !== "{}" && !text.trim().startsWith("<")) {
      return new Response(text, { status: 200, headers: { "Content-Type": "application/json" } });
    }
  } catch (e) {}

  // 3) fetchCritico
  try {
    const res = await window.fetchCritico(path, options, cfg);
    const text = await res.text();
    if (res.ok && text && text.trim() !== "{}" && !text.trim().startsWith("<")) {
      return new Response(text, { status: 200, headers: { "Content-Type": "application/json" } });
    }
  } catch (e) {}

  return makeJsonResponse({ error: "UNIVERSALE_FAILED", path });
};

/* =========================================================
   5) FUNZIONI UNIVERSALI (NON ROUTE)
   Il frontend chiama:
   mmAPI.call("versione")
   mmAPI.call("product-page", { id: 9 })
========================================================= */
window.mmAPI = {
  async call(fn, payload = {}) {

    const candidates = [
      `/` + fn,
      `/` + fn.replace(/-/g, ""),
      `/` + fn.replace(/_/g, ""),
      `/` + fn.toLowerCase(),
      `/` + fn.toUpperCase(),
      `/` + fn + "/run",
      `/` + fn + "/exec",
      `/` + fn + "/call"
    ];

    for (const path of candidates) {
      try {
        const res = await window.fetchUniversale(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const text = await res.text();
        if (!text || text.trim() === "{}" || text.trim().startsWith("<")) continue;

        try {
          return JSON.parse(text);
        } catch (e) {
          continue;
        }

      } catch (e) {}
    }

    return { success: false, error: "FUNZIONE_NON_TROVATA", fn };
  }
};

/* =========================================================
   6) API UTENTE — EVENTO (usa FUNZIONI)
========================================================= */
window.apiUtenteEvento = async function(data = {}) {
  return await window.mmAPI.call("utenti/evento", data);
};
