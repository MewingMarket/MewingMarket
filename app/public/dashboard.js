// =========================================================
// DASHBOARD.JS — Versione PATCHATA (2026.5)
// Compatibile con auth-user + api-utenti.cjs
// =========================================================

console.log("[DASHBOARD] Caricato");

document.addEventListener("auth-ready", initDashboard);

async function initDashboard() {
  console.log("[DASHBOARD] initDashboard()");

  // 1) Verifica login
  if (!window.isLogged) {
    console.warn("[DASHBOARD] Utente non loggato → redirect login");
    window.location.href = "login.html";
    return;
  }

  // ⭐ PATCH: token corretto
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("[DASHBOARD] Nessun token → redirect login");
    window.location.href = "login.html";
    return;
  }

  // ⭐ PATCH: NON sovrascrivere Authorization
  const authHeaders = {
    "Content-Type": "application/json"
  };

  // 2) Carica dati utente — endpoint corretto
  try {
    const res = await fetch("/api/utenti/me", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /me:", data);

    if (res.status === 401 || !data.success) {
      console.warn("[DASHBOARD] Sessione non valida → logout");
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("ruolo");
      window.location.href = "login.html";
      return;
    }

    updateUserUI(data.utente);

  } catch (err) {
    console.error("[DASHBOARD] Errore caricamento utente:", err);
    alert("Errore di connessione.");
  }

  // 3) Ordini
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

  // 4) Download
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
