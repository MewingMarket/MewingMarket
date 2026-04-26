/* =========================================================
   DASHBOARD.JS — Gestione esclusiva Sidebar
========================================================= */
document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await window.fetchUniversale("/api/utenti/me", {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();

    if (data.success && data.utente) {
      const u = data.utente;
      // Popola solo la sidebar
      if (document.getElementById("sidebarEmail")) 
          document.getElementById("sidebarEmail").textContent = u.email;
      if (document.getElementById("sidebarUsername")) 
          document.getElementById("sidebarUsername").textContent = u.username || u.email.split('@')[0];
      if (document.getElementById("sidebarCF")) 
          document.getElementById("sidebarCF").textContent = u.codice_fiscale || "";
    }
  } catch (err) {
    console.error("Errore sidebar:", err);
  }
});
