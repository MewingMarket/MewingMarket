/* =========================================================
   FRONTEND DIAGNOSTICA — Versione 2027.950 (UNIFICATA)
   Compatibile con:
   - universal-json
   - router universale 2027.901
   - fetchCritico 2027
   - diagnostica-loader.js 2027.70
========================================================= */

console.log("🟦 Diagnostica frontend attiva");

/* ---------------------------------------------------------
   1) LOG EVENTI GLOBALI
--------------------------------------------------------- */
document.addEventListener("auth-ready", () => {
  console.log("🟩 [DIAG] auth-ready", {
    isLogged: window.isLogged,
    isAdmin: window.isAdmin,
    email: window.userEmail,
    sessionState: window.sessionState
  });
});

document.addEventListener("auto-logout", () => {
  console.log("🟥 [DIAG] auto-logout");
});

["header-loaded","footer-loaded","head-loaded","header-reset"].forEach(ev => {
  document.addEventListener(ev, () => {
    console.log(`🟩 [DIAG] ${ev}`);
  });
});

/* ---------------------------------------------------------
   2) LOG REDIRECT
--------------------------------------------------------- */
(function patchLocation() {
  const original = window.location;
  const assign = original.assign;
  const replace = original.replace;

  window.location.assign = function(url) {
    console.log("🟦 [DIAG] Redirect (assign):", url);
    return assign.call(original, url);
  };

  window.location.replace = function(url) {
    console.log("🟦 [DIAG] Redirect (replace):", url);
    return replace.call(original, url);
  };
})();

/* ---------------------------------------------------------
   3) LOG apiFetch (se esiste)
--------------------------------------------------------- */
if (typeof window.apiFetch === "function") {
  const original = window.apiFetch;

  window.apiFetch = async function(path, options) {
    console.log("🟦 [DIAG] apiFetch →", path, options);
    const res = await original(path, options);
    console.log("🟩 [DIAG] apiFetch OK →", path, res.status);
    return res;
  };
}

/* ---------------------------------------------------------
   4) LOG fetchCritico (se esiste)
--------------------------------------------------------- */
if (typeof window.fetchCritico === "function") {
  const original = window.fetchCritico;

  window.fetchCritico = async function(path, options, cfg) {
    console.log("🟦 [DIAG] fetchCritico →", path, { options, cfg });
    try {
      const res = await original(path, options, cfg);
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
  const original = Element.prototype.appendChild;

  Element.prototype.appendChild = function(node) {
    if (node.tagName === "SCRIPT") {
      console.log("🟦 [DIAG] Script caricato:", node.src || "(inline)");
    }
    return original.call(this, node);
  };
})();

/* =========================================================
   6) SCANNER SINTASSI JS (compatibile universal-json)
========================================================= */
(function () {
  console.log("🟦 [DIAG] Scanner JS avviato");

  const scripts = [...document.scripts].map(s => s.src).filter(Boolean);

  scripts.forEach(src => {
    fetch(src)
      .then(r => r.text())
      .then(code => {
        if (!code || code.trim().startsWith("<")) return; // HTML → ignora
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
   7) TEST API REALI (compatibili universal-json)
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
      return r.json().catch(() => ({ raw: "NON_JSON" }));
    })
    .then(data => {
      if (data && typeof data === "object") {
        console.log(`🟩 Risposta ${label}:`, data);
      } else {
        console.warn(`🟥 Risposta NON JSON (${label})`, data);
      }
    })
    .catch(err => console.error(`🔥 ERRORE ${label}:`, err));
}

// Prodotti pubblici
testAPI("Prodotti pubblici", "/api/prodotti/getProdotti");

// Ordini utente
testAPI("Ordini utente", "/api/ordini/getOrdiniUtente");

// Admin utenti
testAPI("Admin utenti", "/api/admin/getUtenti");
