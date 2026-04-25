/* =========================================================
 * mm-api.js — Versione STABILE + PATCH SQL-AUTH (2027.925)
 * FIX: Iniezione automatica Token per Ordini, Admin e Utenti
 * ========================================================= */

console.log("🟦 mm-api.js caricato (Fix Auth Injected)");

function makeJsonResponse(obj, status = 500) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

/* 0) FETCH SAFE — fallback automatico a JSON statici */
async function fetchSafe(apiUrl, staticUrl) {
  try {
    // Recupera il token per la fetch di fallback se necessaria
    const token = localStorage.getItem("mewing_token") || localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const r = await fetch(apiUrl, { 
      cache: "no-store",
      headers: headers
    });
    
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

/* 1) FETCH NORMALE con Auto-Auth */
window.fetchNormale = async function(path, options = {}) {
  // PATCH: Iniezione automatica Header Authorization
  const token = localStorage.getItem("mewing_token") || localStorage.getItem("token");
  if (token) {
    options.headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    };
  }
  return fetch(path, options);
};

/* 2) API FETCH (multi-prefix) */
window.apiFetch = async function(path, options = {}) {
  const prefixes = ["/api", "/api/v1", "/api/v2", "/api/latest", "/API"];
  
  // Assicuriamoci che le opzioni includano le credenziali
  options.credentials = options.credentials || "include";

  for (const p of prefixes) {
    const url = p + path;
    try {
      const res = await window.fetchNormale(url, options); // Usa fetchNormale patchata
      if (!res.ok) continue;
      return res;
    } catch (err) {}
  }
  return makeJsonResponse({ error: "API_FETCH_FAILED", path });
};

/* 3) FETCH CRITICO (retry) */
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

/* 4) FETCH UNIVERSALE — Con alias e fallback */
window.fetchUniversale = async function(path, options = {}, cfg = {}) {
  
  function resolveAlias(p) {
    const map = {
      "/catalogo": "/catalog", "/api/catalogo": "/api/catalog",
      "/prodotti": "/products", "/api/prodotti": "/api/products",
      "/categorie": "/categories", "/api/categorie": "/api/categories",
      "/youtube-feed": "/youtube", "/api/youtube-feed": "/api/youtube",
      "/ordini": "/orders", "/api/ordini": "/api/orders",
      "/utenti": "/users", "/api/utenti": "/api/users",
      "/recensioni": "/recensioni", "/api/recensioni": "/api/recensioni"
    };
    return map[p] || p;
  }

  path = resolveAlias(path);

  // --- Gestione Fallback Statici (per mostrare qualcosa anche se SQL è giù) ---
  if (path === "/products" || path === "/api/products") {
    const data = await fetchSafe("/api/products", "/data/products.json");
    return makeJsonResponse(data, 200);
  }
  
  if (path.includes("/orders") || path.includes("/admin")) {
      // Per gli ordini e l'admin non usiamo il fallback statico (per privacy)
      // ma andiamo diretti alla fetch reale con auth
      return await window.apiFetch(path, options);
  }

  // --- Fallback Standard ---
  try {
    const res = await window.fetchNormale(path, options);
    if (res && res.ok) return res;
  } catch (e) {}

  try {
    const res = await window.apiFetch(path, options);
    if (res && res.ok) return res;
  } catch (e) {}

  return await window.fetchCritico(path, options, cfg);
};

/* 5) API UTENTE — EVENTO */
window.apiUtenteEvento = async function(data = {}) {
  try {
    const res = await window.fetchUniversale("/utenti/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "API_UTENTE_EVENTO_FAILED" };
  }
};
