/* =========================================================
   DASHBOARD.JS — Gestione esclusiva Sidebar (PATCH 2027.900)
========================================================= */

document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // ⭐ PATCH — fetch nativo + endpoint Java‑mode
    const res = await fetch("/api/utenti/me", {
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();

    if (data.success && data.utente) {
      const u = data.utente;

      if (document.getElementById("sidebarEmail"))
        document.getElementById("sidebarEmail").textContent = u.email;

      if (document.getElementById("sidebarUsername"))
        document.getElementById("sidebarUsername").textContent =
          u.username || u.email.split("@")[0];

      if (document.getElementById("sidebarCF"))
        document.getElementById("sidebarCF").textContent =
          u.codice_fiscale || "";
    }
  } catch (err) {
    console.error("Errore sidebar:", err);
  }
});
