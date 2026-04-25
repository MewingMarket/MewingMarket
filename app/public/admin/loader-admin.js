/* =========================================================
   LOADER ADMIN — CRITICAL VERSION (2026.401 + API PATCH)
   Versione PATCHATA con critical-ready corretto
========================================================= */

console.log("[ADMIN] Critical loader avviato");

const ADMIN_VERSION = "20260412";

/* ---------------------------------------------------------
   1) CARICAMENTO UTILITY (CRITICAL)
--------------------------------------------------------- */
function loadAdminUtilityScript(name) {
  return new Promise(resolve => {
    const id = `admin-util-${name}`;
    if (document.getElementById(id)) return resolve();

    const s = document.createElement("script");
    s.id = id;

    // PATCH: Reindirizzamento verso mm-api.js per uniformità globale
    if (name === "api") {
      s.src = `/mm-api.js?v=${ADMIN_VERSION}`;   
    } else {
      s.src = `/admin/${name}.js?v=${ADMIN_VERSION}`;
    }

    s.onload = () => {
      console.log(`[ADMIN] ${name}.js caricato`);
      resolve();
    };
    s.onerror = () => {
      console.warn(`[ADMIN] ${name}.js non trovato o errore caricamento`);
      resolve();
    };

    document.head.appendChild(s);
  });
}

/* ---------------------------------------------------------
   2) SAFE LOAD HTML (CRITICAL)
--------------------------------------------------------- */
function safeLoadHTML(url, placeholderId, eventName) {
  return fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
      return r.text();
    })
    .then(html => {
      const ph = document.getElementById(placeholderId);
      if (!ph) {
        console.warn(`[ADMIN] Placeholder mancante: ${placeholderId}`);
        return;
      }
      ph.innerHTML = html;
      document.dispatchEvent(new Event(eventName));
      console.log(`[ADMIN] ${eventName} OK`);
    })
    .catch(err => console.error(`[ADMIN] Errore caricamento ${url}:`, err));
}

/* ---------------------------------------------------------
   3) FUNZIONE PRINCIPALE (CRITICAL)
--------------------------------------------------------- */
async function startAdminLoader() {
  console.log("[ADMIN] Avvio sincronizzazione componenti critici…");

  // Utility JS critiche (mm-api.js è fondamentale per fetchUniversale)
  const apiP = loadAdminUtilityScript("api");          
  const seoP = loadAdminUtilityScript("seo-admin");
  const sdP  = loadAdminUtilityScript("structured-data-admin");

  // HTML critici (Head, Header, Footer)
  const headP = safeLoadHTML(`/admin/head-admin.html?v=${ADMIN_VERSION}`, "head-admin-placeholder", "admin-head-loaded");
  const headerP = safeLoadHTML(`/admin/header-admin.html?v=${ADMIN_VERSION}`, "header-admin-placeholder", "admin-header-loaded");
  const footerP = safeLoadHTML(`/admin/footer-admin.html?v=${ADMIN_VERSION}`, "footer-admin-placeholder", "admin-footer-loaded");

  // Logout admin logic
  document.addEventListener("admin-header-loaded", () => {
    const btn = document.getElementById("logout-admin");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("[ADMIN] Logout eseguito");
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/index.html";
      });
    }
  });

  // Dynamic Title Management
  document.addEventListener("admin-head-loaded", () => {
    const metaTitle = document.querySelector('meta[id="dynamic-title"]');
    if (metaTitle) {
      document.title = metaTitle.content.trim();
    }
  });

  /* -------------------------------------------------------
     EMISSIONE CRITICAL READY
     Attende che TUTTI i file sopra siano pronti
     ------------------------------------------------------- */
  Promise.all([apiP, seoP, sdP, headP, headerP, footerP]).then(() => {
    try {
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
      console.log("[ADMIN] ✅ critical-ready emesso. Dashboard pronta.");
    } catch (e) {
      console.error("[ADMIN] Errore emissione critical-ready:", e);
    }
  });
}

/* ---------------------------------------------------------
   4) ASSICURA AUTH (BOOTSTRAP)
--------------------------------------------------------- */
(function ensureAuthAndStart() {
  // Se l'auth è già stata gestita (es. script inline)
  if (window.isLogged !== undefined && window.isAdmin !== undefined) {
    console.log("[ADMIN] Auth verificata in cache → avvio loader");
    startAdminLoader();
    return;
  }

  console.log("[ADMIN] Verifica Auth necessaria → carico auth.js");

  const s = document.createElement("script");
  s.src = `/auth.js?v=${ADMIN_VERSION}`;
  s.async = true;
  
  s.onload = () => {
    console.log("[ADMIN] auth.js caricato");
    // Se auth.js non emette l'evento, forziamo il controllo
    if (window.isAdmin) startAdminLoader();
  };

  s.onerror = () => {
    console.error("[ADMIN] ERRORE CRITICO: auth.js non raggiungibile.");
    // Fallback: prova comunque ad avviare per non bloccare l'UI se admin-prodotti.js è in attesa
    startAdminLoader();
  };

  document.head.appendChild(s);

  document.addEventListener("auth-ready", () => {
    console.log("[ADMIN] auth-ready ricevuto → avvio loader");
    startAdminLoader();
  });
})();
