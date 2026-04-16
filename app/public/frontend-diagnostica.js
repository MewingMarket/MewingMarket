/* =========================================================
   FRONTEND DIAGNOSTICA — Versione 2027.300 (UNIFICATA)
   - Non blocca nulla
   - Non modifica nulla
   - Logga tutto in modo elegante
   - Compatibile con apiFetch + fetchCritico
   - Scanner sintassi JS
   - Test API reali
========================================================= */

console.log("🟦 Diagnostica frontend attiva");

/* ---------------------------------------------------------
   1) LOG EVENTI GLOBALI
--------------------------------------------------------- */
document.addEventListener("auth-ready", () => {
  console.log("🟩 [DIAG] Evento: auth-ready", {
    isLogged: window.isLogged,
    isAdmin: window.isAdmin,
    email: window.userEmail,
    sessionState: window.sessionState
  });
});

document.addEventListener("auto-logout", () => {
  console.log("🟥 [DIAG] Evento: auto-logout");
});

document.addEventListener("header-loaded", () => {
  console.log("🟩 [DIAG] header-loaded");
});

document.addEventListener("footer-loaded", () => {
  console.log("🟩 [DIAG] footer-loaded");
});

document.addEventListener("head-loaded", () => {
  console.log("🟩 [DIAG] head-loaded");
});

document.addEventListener("header-reset", () => {
  console.log("🟧 [DIAG] header-reset");
});

/* ---------------------------------------------------------
   2) LOG REDIRECT
--------------------------------------------------------- */
(function patchLocation() {
  const original = window.location;
  const originalAssign = original.assign;
  const originalReplace = original.replace;

  window.location.assign = function(url) {
    console.log("🟦 [DIAG] Redirect (assign):", url);
    return originalAssign.call(original, url);
  };

  window.location.replace = function(url) {
    console.log("🟦 [DIAG] Redirect (replace):", url);
    return originalReplace.call(original, url);
  };
})();

/* ---------------------------------------------------------
   3) LOG apiFetch
--------------------------------------------------------- */
if (typeof window.apiFetch === "function") {
  const originalApiFetch = window.apiFetch;

  window.apiFetch = async function(path, options) {
    console.log("🟦 [DIAG] apiFetch →", path, options);
    const res = await originalApiFetch(path, options);
    console.log("🟩 [DIAG] apiFetch OK →", path, res.status);
    return res;
  };
}

/* ---------------------------------------------------------
   4) LOG fetchCritico
--------------------------------------------------------- */
if (typeof window.fetchCritico === "function") {
  const originalFetchCritico = window.fetchCritico;

  window.fetchCritico = async function(path, options, cfg) {
    console.log("🟦 [DIAG] fetchCritico →", path, { options, cfg });
    try {
      const res = await originalFetchCritico(path, options, cfg);
      console.log("🟩 [DIAG] fetchCritico OK →", path, res.status);
      return res;
    } catch (err) {
      console.error("🟥 [DIAG] fetchCritico FAIL →", path, err);
      throw err;
    }
  };
}

/* ---------------------------------------------------------
   5) LOG CARICAMENTO SCRIPT
--------------------------------------------------------- */
(function patchScriptAppend() {
  const originalAppend = Element.prototype.appendChild;

  Element.prototype.appendChild = function(node) {
    if (node.tagName === "SCRIPT") {
      console.log("🟦 [DIAG] Script caricato:", node.src || "(inline)");
    }
    return originalAppend.call(this, node);
  };
})();

/* =========================================================
   6) SCANNER SINTASSI JS (TUO CODICE ORIGINALE)
========================================================= */
(function () {
  console.log("🟦 [FRONTEND DIAGNOSTICA] Scanner JS avviato");

  const scripts = [...document.scripts].map(s => s.src).filter(Boolean);

  scripts.forEach(src => {
    fetch(src)
      .then(r => r.text())
      .then(code => {
        try {
          new Function(code);
        } catch (err) {
          console.error("🔥 ERRORE DI SINTASSI IN:", src, err);
        }
      })
      .catch(err => console.error("🔥 IMPOSSIBILE LEGGERE:", src, err));
  });
})();

/* =========================================================
   7) TEST API REALI (PATCHATI)
========================================================= */

function testAPI(label, path) {
  const doFetch = () => {
    if (typeof window.fetchCritico === "function") {
      console.log(`🟦 [DIAG] Test API via fetchCritico → ${path}`);
      return window.fetchCritico(path, {}, { retries: 1, backoffMs: 200 });
    }

    console.log(`🟦 [DIAG] Test API via fetch → ${path}`);
    return fetch(path);
  };

  doFetch()
    .then(r => {
      console.log(`🟩 Test API ${label} →`, r.status);
      return r.json().catch(() => null);
    })
    .then(data => {
      console.log(`🟩 Risposta ${label}:`, data);
    })
    .catch(err => console.error(`🔥 ERRORE ${label}:`, err));
}

// Prodotti pubblici
testAPI("/api/products", "/products");

// Ordini utente (richiede token)
testAPI("/api/ordini/utente", "/ordini/utente");

// Admin utenti (richiede admin)
testAPI("/api/admin/utenti/lista", "/admin/utenti/lista");
