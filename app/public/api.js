/**
 * =========================================================
 * api.js — Versione 2027.300 (UNIFICATO + DEBUG)
 * - apiFetch: alias universale /api/v1/v2/latest/API/api
 * - fetchCritico: retry + anti-HTML + anti-502
 * - Debug integrato
 * - NON tocca window.fetch
 * =========================================================
 */

console.log("🟦 api.js caricato (UNIFICATO)");

/* =========================================================
   1) API UNIVERSALE — apiFetch
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

    console.log("🟦 [apiFetch] START:", path, opts);

    for (const p of prefixes) {
      const url = p + path;

      try {
        const res = await fetch(url, opts);
        const ct = res.headers.get("content-type") || "";

        if (!res.ok) {
          console.log("🟧 [apiFetch] NOK:", url, res.status);
          continue;
        }
        if (ct.includes("text/html")) {
          console.log("🟧 [apiFetch] HTML inatteso:", url);
          continue;
        }

        console.log("🟩 [apiFetch] MATCH:", url);
        return res;

      } catch (err) {
        console.log("🟥 [apiFetch] ERRORE:", url, err);
        continue;
      }
    }

    console.log("🟥 [apiFetch] Nessuna route valida trovata per:", path);
    throw new Error("Nessuna route API valida per " + path);
  };
}

/* =========================================================
   2) FETCH CRITICO — retry + anti-HTML + anti-502
========================================================= */
if (typeof window.fetchCritico === "undefined") {
  window.fetchCritico = async function(path, options = {}, cfg = {}) {
    const { retries = 3, backoffMs = 400 } = cfg;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        console.log("🟦 [fetchCritico] Tentativo", attempt, "→", path);

        const res = await window.apiFetch(path, options);
        const ct = res.headers.get("content-type") || "";

        if (ct.includes("text/html")) {
          const html = await res.text();
          console.error("🟥 [fetchCritico] HTML inatteso:", html.slice(0, 200));
          throw new Error("HTML inatteso");
        }

        if (!res.ok) {
          if ([502, 503, 504].includes(res.status) && attempt < retries) {
            const wait = backoffMs * (attempt + 1);
            console.log("🟧 [fetchCritico] Retry tra", wait, "ms");
            await new Promise(r => setTimeout(r, wait));
            attempt++;
            continue;
          }
          throw new Error("HTTP " + res.status);
        }

        console.log("🟩 [fetchCritico] OK:", path);
        return res;

      } catch (err) {
        console.error("🟥 [fetchCritico] ERRORE:", path, err);
        if (attempt >= retries) throw err;

        const wait = backoffMs * (attempt + 1);
        await new Promise(r => setTimeout(r, wait));
        attempt++;
      }
    }

    throw new Error("Errore fetchCritico su " + path);
  };
}
