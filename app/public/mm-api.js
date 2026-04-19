/**
 * =========================================================
 * mm-api.js — Versione STABILE (rollback compatibile)
 * - Mantiene fetchNormale, apiFetch, fetchCritico, fetchUniversale
 * - NON tocca login, NON cambia le chiamate esistenti
 * =========================================================
 */

console.log("🟦 mm-api.js caricato (versione stabile compatibile)");

function makeJsonResponse(obj, status = 500) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

/* 1) FETCH NORMALE */
window.fetchNormale = async function(path, options = {}) {
  return fetch(path, options);
};

/* 2) API FETCH (multi-prefix, ma senza filtri aggressivi) */
window.apiFetch = async function(path, options = {}) {
  const prefixes = ["/api", "/api/v1", "/api/v2", "/api/latest", "/API"];

  for (const p of prefixes) {
    const url = p + path;

    try {
      const res = await fetch(url, { ...options, credentials: "include" });
      if (!res.ok) continue;
      return res;
    } catch (err) {
      // prova il prossimo prefix
    }
  }

  return makeJsonResponse({ error: "API_FETCH_FAILED", path });
};

/* 3) FETCH CRITICO (retry su apiFetch) */
window.fetchCritico = async function(path, options = {}, cfg = {}) {
  const { retries = 2, backoffMs = 200 } = cfg;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await window.apiFetch(path, options);
      if (res && res.ok) return res;
    } catch (err) {}

    if (attempt < retries) {
      await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }

  return makeJsonResponse({ error: "FETCH_CRITICO_FAILED", path });
};

/* 4) FETCH UNIVERSALE (catena semplice, NON distruttiva) */
window.fetchUniversale = async function(path, options = {}, cfg = {}) {
  // 1) fetch normale
  try {
    const res = await window.fetchNormale(path, options);
    if (res && res.ok) return res;
  } catch (e) {}

  // 2) apiFetch
  try {
    const res = await window.apiFetch(path, options);
    if (res && res.ok) return res;
  } catch (e) {}

  // 3) fetchCritico
  try {
    const res = await window.fetchCritico(path, options, cfg);
    return res;
  } catch (e) {
    return makeJsonResponse({ error: "UNIVERSALE_FAILED", path });
  }
};

/* 5) API UTENTE — EVENTO (lasciata com’è, ma semplice) */
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
