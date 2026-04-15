// =========================================================
// fetch-critico.js — Retry progressivo + anti-502 + anti-HTML
// Versione 2026.100
// =========================================================

async function fetchCritico(url, options = {}, cfg = {}) {
  const {
    retries = 3,
    backoffMs = 500
  } = cfg;

  let attempt = 0;
  let lastErr;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);

      const ct = res.headers.get("content-type") || "";

      if (ct.includes("text/html")) {
        const html = await res.text();
        console.error("[fetchCritico] HTML inatteso:", html.slice(0, 300));
        throw new Error("Risposta HTML inattesa");
      }

      if (!res.ok) {
        if ([502, 503, 504].includes(res.status) && attempt < retries) {
          const wait = backoffMs * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, wait));
          attempt++;
          continue;
        }
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      return res;

    } catch (err) {
      lastErr = err;
      if (attempt >= retries) break;

      const wait = backoffMs * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, wait));
      attempt++;
    }
  }

  throw lastErr || new Error("Errore fetchCritico");
}
