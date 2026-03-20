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

  const token = localStorage.getItem("sessione"); // PATCH
  if (!token) {
    console.warn("[DASHBOARD] Nessun token → redirect login");
    window.location.href = "login.html";
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };

  // 2) Carica dati utente (PATCH: endpoint corretto)
  try {
    const res = await fetch("/utenti/me", {  // PATCH
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /me:", data);

    if (res.status === 401 || !data.success) {
      console.warn("[DASHBOARD] Sessione non valida → logout");
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    updateUserUI(data.utente);

  } catch (err) {
    console.error("[DASHBOARD] Errore caricamento utente:", err);
    alert("Errore di connessione.");
  }

  // 3) Ordini (solo se implementati)
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

  // 4) Download (solo se implementati)
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
