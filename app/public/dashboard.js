// =========================================================
// DASHBOARD.JS — Versione FINALE (2026.10)
// Compatibile con auth-user + api-utenti.cjs + sessionState
// =========================================================

console.log("[DASHBOARD] Caricato");

// La dashboard parte SOLO dopo auth-ready
document.addEventListener("auth-ready", initDashboard);

async function initDashboard() {
  console.log("[DASHBOARD] initDashboard()");

  // -------------------------------------------------------
  // 1) Verifica stato sessione
  // -------------------------------------------------------
  const token = localStorage.getItem("token");
  const sessionState = parseInt(localStorage.getItem("sessionState") || "0", 10);

  // Utente NON loggato → redirect
  if (!token || !window.isLogged || sessionState !== 1) {
    console.warn("[DASHBOARD] Nessuna sessione valida → redirect login");
    window.location.href = "login.html";
    return;
  }

  // -------------------------------------------------------
  // 2) Header Authorization
  // -------------------------------------------------------
  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };

  // -------------------------------------------------------
  // 3) Carica dati utente (/me)
  // -------------------------------------------------------
  try {
    const res = await fetch("/api/utenti/me", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /me:", data);

    // Sessione scaduta o token invalido
    if (res.status === 401 || !data.success || !data.utente) {
      console.warn("[DASHBOARD] Sessione non valida → logout");
      logoutAndRedirect();
      return;
    }

    updateUserUI(data.utente);

  } catch (err) {
    console.error("[DASHBOARD] Errore caricamento utente:", err);
    alert("Errore di connessione.");
    return;
  }

  // -------------------------------------------------------
  // 4) Ordini — usa /api/ordini/utente (backend reale)
  // -------------------------------------------------------
  try {
    const res = await fetch("/api/ordini/utente", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /ordini/utente:", data);

    if (res.status === 401) {
      console.warn("[DASHBOARD] 401 su ordini → logout");
      logoutAndRedirect();
      return;
    }

    if (data && Array.isArray(data.ordini)) {
      updateOrdersUI(data.ordini);
    } else {
      updateOrdersUI([]);
    }

  } catch (err) {
    console.error("[DASHBOARD] Errore ordini:", err);
    updateOrdersUI([]);
  }

  // -------------------------------------------------------
  // 5) Download — lasciato pronto per /api/download/miei
  //    (se la route non esiste, non blocca la dashboard)
  // -------------------------------------------------------
  try {
    const res = await fetch("/api/download/miei", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /download/miei:", data);

    if (res.status === 401) {
      console.warn("[DASHBOARD] 401 su download → logout");
      logoutAndRedirect();
      return;
    }

    if (data && Array.isArray(data.download)) {
      updateDownloadsUI(data.download);
    } else {
      updateDownloadsUI([]);
    }

  } catch (err) {
    console.error("[DASHBOARD] Errore download:", err);
    if (typeof updateDownloadsUI === "function") {
      updateDownloadsUI([]);
    }
  }
}

// =========================================================
// AGGIORNA UI UTENTE — CF al centro
// =========================================================
function updateUserUI(utente) {
  if (!utente) return;

  const cf = utente.codice_fiscale || "";

  const sidebarCF = document.getElementById("sidebarCF");
  const userCF = document.getElementById("userCF");

  if (sidebarCF) sidebarCF.textContent = cf;
  if (userCF) userCF.textContent = cf;

  const username = document.getElementById("username");
  const sidebarUsername = document.getElementById("sidebarUsername");

  if (username) username.textContent = utente.username || "";
  if (sidebarUsername) sidebarUsername.textContent = utente.username || "";
}

// =========================================================
// LOGOUT PULITO
// =========================================================
function logoutAndRedirect() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  localStorage.removeItem("ruolo");
  localStorage.setItem("sessionState", "0");
  window.location.href = "login.html";
}
