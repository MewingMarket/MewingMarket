// =========================================================
// DASHBOARD.JS — Versione PATCHATA (2026.10)
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
    if (res.status === 401 || !data.success) {
      console.warn("[DASHBOARD] Sessione non valida → logout");
      logoutAndRedirect();
      return;
    }

    // Aggiorna UI
    updateUserUI(data.utente);

  } catch (err) {
    console.error("[DASHBOARD] Errore caricamento utente:", err);
    alert("Errore di connessione.");
    return;
  }

  // -------------------------------------------------------
  // 4) Ordini
  // -------------------------------------------------------
  try {
    const res = await fetch("/api/ordini/miei", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /ordini/miei:", data);

    if (res.status !== 401) {
      updateOrdersUI(data.ordini || []);
    }

  } catch (err) {
    console.error("[DASHBOARD] Errore ordini:", err);
  }

  // -------------------------------------------------------
  // 5) Download
  // -------------------------------------------------------
  try {
    const res = await fetch("/api/download/miei", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /download/miei:", data);

    if (res.status !== 401) {
      updateDownloadsUI(data.download || []);
    }

  } catch (err) {
    console.error("[DASHBOARD] Errore download:", err);
  }
}

// =========================================================
// AGGIORNA UI UTENTE — VERSIONE CF
// =========================================================
function updateUserUI(utente) {
  if (!utente) return;

  // 🔥 Mostra CF invece dell’email
  const cf = utente.codice_fiscale || "";

  const sidebarCF = document.getElementById("sidebarCF");
  const userCF = document.getElementById("userCF");

  if (sidebarCF) sidebarCF.textContent = cf;
  if (userCF) userCF.textContent = cf;

  // Username (se lo usi)
  const username = document.getElementById("username");
  const sidebarUsername = document.getElementById("sidebarUsername");

  if (username) username.textContent = utente.username || "";
  if (sidebarUsername) sidebarUsername.textContent = utente.username || "";
}

// =========================================================
// LOGOUT PULITO (senza cancellazioni impulsive)
// =========================================================
function logoutAndRedirect() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  localStorage.removeItem("ruolo");
  localStorage.setItem("sessionState", "0");
  window.location.href = "login.html";
}
