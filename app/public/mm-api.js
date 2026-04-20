/**
 * =========================================================
 * mm-api.js — Versione STABILE + PATCH fetchSafe (2027.920)
 * - Mantiene fetchNormale, apiFetch, fetchCritico, fetchUniversale
 * - Aggiunge fetchSafe come sotto-funzione interna
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

/* =========================================================
   0) FETCH SAFE — fallback automatico a JSON statici
========================================================= */
async function fetchSafe(apiUrl, staticUrl) {
  try {
    const r = await fetch(apiUrl, { cache: "no-store" });
    if (!r.ok) throw new Error("API non ok");

    const data = await r.json();
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error("API vuota");
    }

    return data;
  } catch (err) {
    console.warn("⚠️ API FALLITA:", apiUrl, "→ uso statico:", staticUrl);

    if (!staticUrl) return null;

    const r2 = await fetch(staticUrl + "?v=" + Date.now());
    return r2.json();
  }
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
      if (!res.ok) continue;
      return res;
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
      if (res && res.ok) return res;
    } catch (err) {}

    if (attempt < retries) {
      await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }

  return makeJsonResponse({ error: "FETCH_CRITICO_FAILED", path });
};

/* =========================================================
   4) FETCH UNIVERSALE — potenziato con alias-engine client-side
========================================================= */
window.fetchUniversale = async function(path, options = {}, cfg = {}) {

  /* =========================================================
     PATCH: alias client-side → sincronizzati con alias-engine
  ========================================================== */
  function resolveAlias(p) {
    const map = {
      "/catalogo": "/catalog",
      "/api/catalogo": "/api/catalog",

      "/prodotti": "/products",
      "/api/prodotti": "/api/products",

      "/categorie": "/categories",
      "/api/categorie": "/api/categories",

      "/youtube-feed": "/youtube",
      "/api/youtube-feed": "/api/youtube",

      "/recensioni-top": "/recensioni-top",
      "/api/recensioni-top": "/api/recensioni-top",

      "/recensioni": "/recensioni",
      "/api/recensioni": "/api/recensioni",

      "/feedbacks": "/feedback",
      "/api/feedbacks": "/api/feedback",

      "/vendite": "/sales",
      "/api/vendite": "/api/sales",

      "/ordini": "/orders",
      "/api/ordini": "/api/orders",

      "/utenti-eventi": "/user-events",
      "/api/utenti-eventi": "/api/user-events",

      "/kpi-giornalieri": "/kpi-daily",
      "/api/kpi-giornalieri": "/api/kpi-daily",

      "/kpi-settimanali": "/kpi-weekly",
      "/api/kpi-settimanali": "/api/kpi-weekly",

      "/kpi-mensili": "/kpi-monthly",
      "/api/kpi-mensili": "/api/kpi-monthly",

      "/stato-sistema": "/system-status",
      "/api/stato-sistema": "/api/system-status",

      "/versione-sito": "/versione",
      "/api/versione-sito": "/api/versione"
    };

    // alias esatti
    if (map[p]) return map[p];

    // alias dinamici product-page
    if (p.startsWith("/product-page/")) {
      return p.replace("/product-page/", "/api/product-page/");
    }

    return p;
  }

  // Applica alias
  path = resolveAlias(path);

  /* =========================================================
     PATCH: fallback automatico per catalogo
  ========================================================== */
  if (path === "/catalog" || path === "/api/catalog") {
    const data = await fetchSafe("/api/catalog", "/data/catalog.json");
    return makeJsonResponse(data, 200);
  }

  /* =========================================================
     PATCH: fallback automatico per pagina prodotto
  ========================================================== */
  if (path.startsWith("/api/product-page/")) {
    const data = await fetchSafe(path, "/data/products.json");
    return makeJsonResponse(data, 200);
  }

  /* =========================================================
     PATCH: fallback automatico per categorie
  ========================================================== */
  if (path === "/categories" || path === "/api/categories") {
    const data = await fetchSafe("/api/categories", "/data/categories.json");
    return makeJsonResponse(data, 200);
  }

  /* =========================================================
     PATCH: fallback automatico per prodotti
  ========================================================== */
  if (path === "/products" || path === "/api/products") {
    const data = await fetchSafe("/api/products", "/data/products.json");
    return makeJsonResponse(data, 200);
  }

  /* =========================================================
     PATCH: fallback automatico per youtube
  ========================================================== */
  if (path === "/youtube" || path === "/api/youtube") {
    const data = await fetchSafe("/api/youtube", "/data/youtube.json");
    return makeJsonResponse(data, 200);
  }

  /* =========================================================
     PATCH: fallback automatico per recensioni
  ========================================================== */
  if (path === "/recensioni" || path === "/api/recensioni") {
    const data = await fetchSafe("/api/recensioni", "/data/recensioni.json");
    return makeJsonResponse(data, 200);
  }

  /* =========================================================
     PATCH: fallback automatico per KPI
  ========================================================== */
  if (path === "/kpi-daily" || path === "/api/kpi-daily") {
    const data = await fetchSafe("/api/kpi-daily", "/data/kpi-daily.json");
    return makeJsonResponse(data, 200);
  }

  if (path === "/kpi-weekly" || path === "/api/kpi-weekly") {
    const data = await fetchSafe("/api/kpi-weekly", "/data/kpi-weekly.json");
    return makeJsonResponse(data, 200);
  }

  if (path === "/kpi-monthly" || path === "/api/kpi-monthly") {
    const data = await fetchSafe("/api/kpi-monthly", "/data/kpi-monthly.json");
    return makeJsonResponse(data, 200);
  }

  /* =========================================================
     FALLBACK STANDARD (normale → apiFetch → critico)
  ========================================================== */

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

/* =========================================================
   5) API UTENTE — EVENTO
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
