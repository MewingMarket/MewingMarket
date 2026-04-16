/**
 * =========================================================
 * UNIVERSAL FRONTEND FETCH — Versione 2027
 * Prova tutte le versioni API finché una risponde.
 * Sempre credentials: "include"
 * Debug completo
 * =========================================================
 */

async function apiFetch(path, options = {}) {
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

      console.log("🟩 [API-FETCH] MATCH:", url);
      return res;

    } catch (err) {
      console.log("🟧 [API-FETCH] FALLITO:", url);
      continue;
    }
  }

  console.log("🟥 [API-FETCH] NESSUNA ROUTE VALIDA TROVATA");
  throw new Error("API non disponibile");
}
