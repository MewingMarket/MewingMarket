/**
 * =========================================================
 * mm-api.js — Versione 2027.903 (FIX DEFINITIVO + UNIVERSALE)
 * - Scarta TUTTI i 404
 * - Scarta TUTTI gli HTML
 * - Accetta SOLO il primo 200 valido
 * - Nessun null, nessun {} fantasma
 * - Aggiunta fetchNormale() + fetchUniversale()
 * =========================================================
 */

console.log("🟦 api.js caricato (FIX DEFINITIVO + UNIVERSALE)");

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
   1) FETCH NORMALE (nativo)
========================================================= */
window.fetchNormale = async function(path, options = {}) {
  return fetch(path, options);
};

/* =========================================================
   2) API FETCH (VERSIONE FIXATA 2027.902)
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
   3) FETCH CRITICO (VERSIONE FIXATA 2027.902)
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

/* =========================================================
   4) FETCH UNIVERSALE (fallback chain)
   - 1) fetchNormale
   - 2) apiFetch
   - 3) fetchCritico
========================================================= */
window.fetchUniversale = async function(path, options = {}, cfg = {}) {

  // 1) Tentativo — fetch normale
  try {
    const res = await window.fetchNormale(path, options);
    if (res.ok) {
      console.log("🟩 [UNIVERSALE] fetch normale OK");
      return res;
    }
    console.warn("⚠️ [UNIVERSALE] fetch normale NON ok:", res.status);
  } catch (e) {
    console.warn("⚠️ [UNIVERSALE] fetch normale fallita:", e);
  }

  // 2) Tentativo — apiFetch
  try {
    const res = await window.apiFetch(path, options, cfg);
    if (res.ok) {
      console.log("🟩 [UNIVERSALE] apiFetch OK");
      return res;
    }
    console.warn("⚠️ [UNIVERSALE] apiFetch NON ok:", res.status);
  } catch (e) {
    console.warn("⚠️ [UNIVERSALE] apiFetch fallita:", e);
  }

  // 3) Tentativo — fetchCritico (modalità resilienza)
  try {
    console.warn("🟥 [UNIVERSALE] Attivo fetchCritico (fallback finale)");
    const res = await window.fetchCritico(path, options, cfg);
    return res;
  } catch (e) {
    console.error("🔥 [UNIVERSALE] fetchCritico fallita:", e);
    throw e;
  }
};
/* =========================================================
   5) API UTENTE — EVENTO (nuova route)
========================================================= */
window.apiUtenteEvento = async function(data = {}) {
  try {
    const res = await window.fetchUniversale("/utenti/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    return await res.json();
  } catch (err) {
    console.error("🔥 apiUtenteEvento errore:", err);
    return { success: false, error: "API_UTENTE_EVENTO_FAILED" };
  }
};
