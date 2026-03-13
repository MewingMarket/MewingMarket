/* =========================================================
   DASHBOARD ADMIN — Versione compatibile con backend SQL
========================================================= */

console.log("[ADMIN] Dashboard admin avviata");

// ---------------------------------------------------------
// 1) CARICA DATI ADMIN DAL LOCALSTORAGE
// ---------------------------------------------------------
document.addEventListener("auth-ready", () => {
  if (!window.isAdmin) {
    console.warn("[ADMIN] Accesso negato → non sei admin");
    window.location.href = "index.html";
    return;
  }

  const email = localStorage.getItem("email");
  const ruolo = localStorage.getItem("ruolo");

  document.getElementById("adminEmail").textContent = email;
  document.getElementById("adminRole").textContent = ruolo;

  document.getElementById("adminEmailMain").textContent = email;
  document.getElementById("adminRoleMain").textContent = ruolo;
});

// ---------------------------------------------------------
// 2) NAVIGAZIONE PANNELLI
// ---------------------------------------------------------
const navItems = document.querySelectorAll(".nav-item-admin");
const panels = document.querySelectorAll(".content-admin");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const panel = item.dataset.panel;

    navItems.forEach(i => i.classList.remove("active"));
    panels.forEach(p => p.classList.add("hidden"));

    item.classList.add("active");
    document.getElementById(`panel-${panel}`).classList.remove("hidden");
  });
});

// Pannello iniziale
document.querySelector('[data-panel="profilo"]').classList.add("active");

// ---------------------------------------------------------
// 3) CAMBIO EMAIL ADMIN
// ---------------------------------------------------------
document.getElementById("btnAdminCambiaEmail").addEventListener("click", async () => {
  const nuova_email = document.getElementById("newAdminEmail").value.trim().toLowerCase();
  const password = document.getElementById("passwordAdminEmail").value.trim();
  const msg = document.getElementById("msgAdminEmail");
  const token = localStorage.getItem("session");

  msg.textContent = "";

  if (!nuova_email || !password) {
    msg.textContent = "Compila tutti i campi.";
    return;
  }

  try {
    const res = await fetch("/api/utenti/cambia-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuova_email, password, token })
    });

    const data = await res.json();
    console.log("[ADMIN] Cambio email:", data);

    if (!data.success) {
      msg.textContent = data.error || "Errore.";
      return;
    }

    localStorage.setItem("email", nuova_email);
    msg.textContent = "Email aggiornata!";

  } catch (err) {
    msg.textContent = "Errore server.";
  }
});

// ---------------------------------------------------------
// 4) CAMBIO PASSWORD ADMIN
// ---------------------------------------------------------
document.getElementById("btnAdminCambiaPassword").addEventListener("click", async () => {
  const oldPass = document.getElementById("oldAdminPassword").value.trim();
  const newPass = document.getElementById("newAdminPassword").value.trim();
  const msg = document.getElementById("msgAdminPassword");
  const token = localStorage.getItem("session");

  msg.textContent = "";

  if (!oldPass || !newPass) {
    msg.textContent = "Compila tutti i campi.";
    return;
  }

  try {
    const res = await fetch("/api/utenti/cambia-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: oldPass, nuova_password: newPass, token })
    });

    const data = await res.json();
    console.log("[ADMIN] Cambio password:", data);

    if (!data.success) {
      msg.textContent = data.error || "Errore.";
      return;
    }

    msg.textContent = "Password aggiornata!";

  } catch (err) {
    msg.textContent = "Errore server.";
  }
});

// ---------------------------------------------------------
// 5) LOGOUT ADMIN
// ---------------------------------------------------------
document.getElementById("logout-admin").addEventListener("click", () => {
  console.log("[ADMIN] Logout admin");
  localStorage.clear();
  window.location.href = "index.html";
});
