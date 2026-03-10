/* =========================================================
   DASHBOARD ADMIN – LOGICA PANNELLI + PROFILO
   ========================================================= */

// Stato admin
let adminEmail = null;
let adminRole = null;

// ---------------------------------------------------------
// 1) CARICA DATI ADMIN
// ---------------------------------------------------------
async function loadAdminData() {
  try {
    const res = await fetch("/api/user/me", { credentials: "include" });
    if (!res.ok) throw new Error("Non loggato");

    const user = await res.json();

    // Normalizzazione ruolo
    const ruoloRaw = String(user.ruolo || "").trim().toLowerCase();
    let ruoloNorm = "user";

    if (
      ruoloRaw.includes("admin") ||
      ruoloRaw.includes("amministrator")
    ) {
      ruoloNorm = "admin";
    } else if (
      ruoloRaw.includes("user") ||
      ruoloRaw.includes("utente")
    ) {
      ruoloNorm = "user";
    } else if (
      ruoloRaw.includes("guest") ||
      ruoloRaw.includes("ospite")
    ) {
      ruoloNorm = "guest";
    }

    adminEmail = user.email;
    adminRole = ruoloNorm;

    // Inserimento nei campi UI
    document.getElementById("adminEmail").textContent = adminEmail;
    document.getElementById("adminRole").textContent = "Admin";

    document.getElementById("adminEmailMain").textContent = adminEmail;
    document.getElementById("adminRoleMain").textContent = "Admin";

  } catch (err) {
    console.error("Errore caricamento admin:", err);
    window.location.href = "/";
  }
}

loadAdminData();


// ---------------------------------------------------------
// 2) GESTIONE PANNELLI
// ---------------------------------------------------------
const navItems = document.querySelectorAll(".nav-item-admin");
const panels = document.querySelectorAll(".content-admin");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const panel = item.dataset.panel;

    // Rimuove attivi
    navItems.forEach(i => i.classList.remove("active"));
    panels.forEach(p => p.classList.add("hidden"));

    // Attiva selezionato
    item.classList.add("active");
    document.getElementById(`panel-${panel}`).classList.remove("hidden");
  });
});

// Imposta pannello iniziale
document.querySelector('[data-panel="profilo"]').classList.add("active");


// ---------------------------------------------------------
// 3) CAMBIO EMAIL ADMIN
// ---------------------------------------------------------
document.getElementById("btnAdminCambiaEmail").addEventListener("click", async () => {
  const newEmail = document.getElementById("newAdminEmail").value.trim();
  const password = document.getElementById("passwordAdminEmail").value.trim();
  const msg = document.getElementById("msgAdminEmail");

  msg.textContent = "";

  if (!newEmail || !password) {
    msg.textContent = "Compila tutti i campi.";
    return;
  }

  try {
    const res = await fetch("/api/user/change-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail, password })
    });

    const data = await res.json();

    if (!data.success) {
      msg.textContent = data.error || "Errore.";
      return;
    }

    msg.textContent = "Email aggiornata!";
    loadAdminData();

  } catch (err) {
    msg.textContent = "Errore server.";
  }
});


// ---------------------------------------------------------
// 4) CAMBIO PASSWORD ADMIN
// ---------------------------------------------------------
document.getElementById("btnAdminCambiaPassword").addEventListener("click", async () => {
  const oldPassword = document.getElementById("oldAdminPassword").value.trim();
  const newPassword = document.getElementById("newAdminPassword").value.trim();
  const msg = document.getElementById("msgAdminPassword");

  msg.textContent = "";

  if (!oldPassword || !newPassword) {
    msg.textContent = "Compila tutti i campi.";
    return;
  }

  try {
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword })
    });

    const data = await res.json();

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
document.getElementById("logout-admin").addEventListener("click", async () => {
  await fetch("/api/user/logout", { method: "POST", credentials: "include" });
  window.location.href = "/";
});
