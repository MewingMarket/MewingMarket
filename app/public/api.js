/**
 * =========================================================
 * api.js — Versione 2027.210 (SAFE)
 * UNIVERSAL API FETCH + FALLBACK
 * - Prova più prefissi API
 * - Se fallisce → fallback fetchCritico
 * - Se fallisce → fetch normale
 * - NON tocca window.fetch
 * =========================================================
 */

console.log("🟦 api.js caricato (SAFE)");

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

    if (typeof window.fetchCritico === "function") {
      try {
        return await window.fetchCritico(path, opts);
      } catch (err) {
        console.log("🟥 [apiFetch] fetchCritico fallito:", err);
      }
    }

    console.log("🟥 [apiFetch] fallback fetch normale:", path);
    return fetch(path, opts);
  };
}
