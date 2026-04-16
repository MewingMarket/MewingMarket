/**
 * =========================================================
 * api.js — Versione 2027.200
 * UNIVERSAL API FETCH + FALLBACK + INTERCEPTOR
 * - Prova tutte le versioni API
 * - Se fallisce → fallback fetchCritico
 * - Se fallisce → fallback fetch normale
 * - Se apiFetch non è definito → lo definisce da solo
 * - Intercetta fetch diretti verso /api e li reindirizza
 * =========================================================
 */

console.log("🟦 api.js caricato");

/* =========================================================
   1) DEFINIZIONE apiFetch SE NON ESISTE
========================================================= */
if (typeof window.apiFetch === "undefined") {
  window.apiFetch = async function(path, options = {}) {
    const prefixes = [
      "/api/v1",
      "/api/v2",
      "/api/latest",
      "/api",
      "/API",
      "/Api",
      "/aPi"
    ];

    const opts = {
      ...options,
      credentials: "include"
    };

    for (const p of prefixes) {
      const url = p + path;

      try {
        const res = await fetch(url, opts);
        const ct = res.headers.get("content-type") || "";

        if (!res.ok) continue;
        if (ct.includes("text/html")) continue;

        console.log("🟩 [apiFetch] MATCH:", url);
        return res;

      } catch (err) {
        console.log("🟧 [apiFetch] FALLITO:", url);
        continue;
      }
    }

    console.log("🟥 [apiFetch] Nessuna route valida trovata → fallback fetchCritico");

    /* =========================================================
       FALLBACK 1 — fetchCritico
    ========================================================= */
    if (typeof window.fetchCritico === "function") {
      try {
        return await window.fetchCritico(path, opts);
      } catch (err) {
        console.log("🟥 [apiFetch] fetchCritico fallito:", err);
      }
    }

    /* =========================================================
       FALLBACK 2 — fetch normale
    ========================================================= */
    console.log("🟥 [apiFetch] fallback fetch normale:", path);
    return fetch(path, opts);
  };
}

/* =========================================================
   2) INTERCEPTOR FETCH — intercetta fetch diretti verso /api
========================================================= */
(function interceptFetch() {
  const originalFetch = window.fetch;

  window.fetch = async function(url, options = {}) {
    // Se la URL è stringa e inizia con /api → reindirizza a apiFetch
    if (typeof url === "string" && url.startsWith("/api")) {
      console.log("🟦 Intercetto fetch → apiFetch:", url);
      return window.apiFetch(url.replace("/api", ""), options);
    }

    // Altrimenti fetch normale
    return originalFetch(url, options);
  };
})();
