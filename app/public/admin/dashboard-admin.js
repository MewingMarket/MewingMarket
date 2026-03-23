/* =========================================================
   DASHBOARD ADMIN — Versione 2026.50
   Struttura semplice: header + pagina + footer
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
     2) Popola dati admin nella pagina
  ========================================================== */
  const emailSpan = document.getElementById("adminEmailMain");
  const ruoloSpan = document.getElementById("adminRoleMain");

  if (emailSpan) emailSpan.textContent = email;
  if (ruoloSpan) ruoloSpan.textContent = "Admin";

  /* =========================================================
     3) Logout admin
  ========================================================== */
  const logoutBtn = document.getElementById("logout-admin");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "../index.html";
    });
  }

  /* =========================================================
     4) Cambia email admin
  ========================================================== */
  const btnEmail = document.getElementById("btnAdminCambiaEmail");
  if (btnEmail) {
    btnEmail.addEventListener("click", async () => {
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
  }

  /* =========================================================
     5) Cambia password admin
  ========================================================== */
  const btnPass = document.getElementById("btnAdminCambiaPassword");
  if (btnPass) {
    btnPass.addEventListener("click", async () => {
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
  }

});
