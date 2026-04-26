// =========================================================
// Dashboard Admin — Vendite + Ordini (Unificata)
// Fix: FETCH NORMALE + API PREFIX
// =========================================================

document.addEventListener("critical-ready", async () => {
  console.log("🔥 [ADMIN] Dashboard INIT");

  const token = localStorage.getItem("token");
  const sessionState = localStorage.getItem("sessionState");

  if (!token || sessionState !== "1") {
    alert("Sessione scaduta. Effettua di nuovo il login.");
    location.href = "/login";
    return;
  }

  try {
    // ⭐ Usiamo fetch normale puntando esplicitamente a /api/admin/dashboard
    const response = await fetch("/api/admin/dashboard", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status risposta:", response.status);

    if (response.status === 404) {
      console.warn("⚠️ Rotta /api/admin/dashboard non trovata. Provo senza /api...");
      // Secondo tentativo senza prefisso se il router è montato diversamente
      const retry = await fetch("/admin/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (retry.ok) {
        processDashboardData(await retry.json());
        return;
      }
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error("❌ Errore Backend:", data.error);
      alert("Accesso negato: " + (data.error || "Verifica i permessi admin"));
      return;
    }

    processDashboardData(data);

  } catch (err) {
    console.error("❌ ERRORE FETCH DASHBOARD:", err);
    alert("Errore di connessione al server.");
  }
});

function processDashboardData(data) {
    console.log("📦 Dati ricevuti dal server:", data);
    renderKPI(data);
    renderTopProdotti(data?.vendite?.topProdotti || []);
    renderOrdini(data?.ordini?.lista || []);
}

// ... Mantieni le tue funzioni renderKPI e renderOrdini invariate ...
