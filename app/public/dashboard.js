/* =========================================================
   DASHBOARD.JS — Versione HUB (FETCH UNIVERSALE)
   - Gestione centralizzata sidebar e autenticazione
   - Compatibile con layout a pagine separate
   - Versione: 2026.400
========================================================= */

console.log("🔵 [DASHBOARD] Init Hub...");

// La dashboard parte SOLO dopo critical-ready
document.addEventListener("critical-ready", initDashboard);

async function initDashboard() {
  console.log("🟢 [DASHBOARD] initDashboard()");

  // -------------------------------------------------------
  // 1) VERIFICA SESSIONE
  // -------------------------------------------------------
  const token = localStorage.getItem("token");
  const sessionState = parseInt(localStorage.getItem("sessionState") || "0", 10);

  // Se non c'è token o lo stato sessione è 0, rimandiamo al login
  if (!token || sessionState !== 1) {
    console.warn("[DASHBOARD] Sessione non valida → redirect login");
    window.location.href = "login.html";
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };

  // -------------------------------------------------------
  // 2) CARICA DATI UTENTE (/ME)
  // -------------------------------------------------------
  try {
    const res = await window.fetchUniversale(
      "/api/utenti/me",
      { method: "GET", headers: authHeaders },
      { retries: 3, backoffMs: 500 }
    );

    const data = await res.json().catch(() => ({}));

    // Se il server risponde 401 o non trova l'utente, puliamo e usciamo
    if (res.status === 401 || !data.success || !data.utente) {
      console.warn("[DASHBOARD] Token scaduto o utente non trovato.");
      logoutAndRedirect();
      return;
    }

    // Popoliamo la UI (Sidebar e info generali)
    updateUserUI(data.utente);

  } catch (err) {
    console.error("[DASHBOARD] Errore critico recupero profilo:", err);
    // In caso di errore di rete, non forziamo il logout subito per non frustrare l'utente
  }
}

// =========================================================
// AGGIORNA UI UTENTE (Sidebar + Campi Profilo se presenti)
// =========================================================
function updateUserUI(utente) {
  if (!utente) return;

  const email = utente.email || "";
  const usernameCalc = utente.username || email.split("@")[0];
  const cf = utente.codice_fiscale || "Non specificato";

  // Mappatura ID elementi -> Valore da inserire
  const uiMapping = {
    "sidebarEmail": email,
    "sidebarUsername": usernameCalc,
    "sidebarCF": cf,
    "userEmail": email,    // Presente in profilo.html
    "username": usernameCalc,  // Presente in profilo.html
    "userCF": cf           // Presente in profilo.html
  };

  // Popoliamo tutti gli elementi trovati nel DOM
  Object.keys(uiMapping).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = uiMapping[id];
    }
  });
}

// =========================================================
// LOGOUT E PULIZIA
// =========================================================
function logoutAndRedirect() {
  localStorage.removeItem("token");
  localStorage.setItem("sessionState", "0");
  // Se hai un cookie di sessione, andrebbe rimosso lato server o qui
  window.location.href = "login.html";
}

// =========================================================
// GESTIONE SIDEBAR (Logout Event)
// =========================================================
document.addEventListener("click", (e) => {
  // Se l'utente clicca un elemento con ID sidebar-nav-logout (se presente)
  if (e.target.id === "sidebar-nav-logout") {
    if (confirm("Vuoi uscire dalla tua area riservata?")) {
      logoutAndRedirect();
    }
  }
});

// =========================================================
// RICEZIONE MESSAGGI (Paypal o Refresh)
// =========================================================
window.addEventListener("message", (e) => {
  if (["refresh_dashboard", "paypal_complete"].includes(e.data)) {
    console.log("🔄 [DASHBOARD] Refresh richiesto da messaggio esterno");
    initDashboard();
  }
});
