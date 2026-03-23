/* =========================================================
   DASHBOARD ADMIN — Versione 2026.40
   Gestione pannelli reali + protezione admin
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     1) Protezione accesso admin
  ========================================================== */
  const token = localStorage.getItem("token");
  const ruolo = localStorage.getItem("ruolo");
  const email = localStorage.getItem("email");

  if (!token || ruolo !== "admin") {
    window.location.href = "../index.html";
    return;
  }

  /* =========================================================
     2) Popola sidebar + profilo
  ========================================================== */
  document.getElementById("adminEmail").textContent = email;
  document.getElementById("adminRole").textContent = "Admin";

  document.getElementById("adminEmailMain").textContent = email;
  document.getElementById("adminRoleMain").textContent = "Admin";

  /* =========================================================
     3) Gestione pannelli
  ========================================================== */
  const navItems = document.querySelectorAll(".nav-item");
  const panels = document.querySelectorAll(".content");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const panel = item.dataset.panel;

      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");

      panels.forEach(p => p.classList.add("hidden"));
      document.getElementById(`panel-${panel}`).classList.remove("hidden");
    });
  });

  // Imposta pannello iniziale
  document.querySelector('.nav-item[data-panel="profilo"]').classList.add("active");

  /* =========================================================
     4) Logout admin
  ========================================================== */
  document.getElementById("logout-admin").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  /* =========================================================
     5) Cambia email admin
  ========================================================== */
  document.getElementById("btnAdminCambiaEmail").addEventListener("click", async () => {
    const nuova = document.getElementById("newAdminEmail").value.trim();
    const pass = document.getElementById("passwordAdminEmail").value.trim();
    const msg = document.getElementById("msgAdminEmail");

    if (!nuova || !pass) {
      msg.textContent = "Compila tutti i campi.";
      return;
    }

    try {
      const res = await fetch("/api/admin/cambia-email", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nuova, pass })
      });

      const data = await res.json();
      msg.textContent = data.message || data.error;

    } catch (err) {
      msg.textContent = "Errore di connessione.";
    }
  });

  /* =========================================================
     6) Cambia password admin
  ========================================================== */
  document.getElementById("btnAdminCambiaPassword").addEventListener("click", async () => {
    const oldP = document.getElementById("oldAdminPassword").value.trim();
    const newP = document.getElementById("newAdminPassword").value.trim();
    const msg = document.getElementById("msgAdminPassword");

    if (!oldP || !newP) {
      msg.textContent = "Compila tutti i campi.";
      return;
    }

    try {
      const res = await fetch("/api/admin/cambia-password", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ oldP, newP })
      });

      const data = await res.json();
      msg.textContent = data.message || data.error;

    } catch (err) {
      msg.textContent = "Errore di connessione.";
    }
  });

});
