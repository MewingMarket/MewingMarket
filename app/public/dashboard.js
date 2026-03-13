/* =========================================================
   FILE: /public/dashboard.js
   DASHBOARD — Versione DEFINITIVA per backend SQL
========================================================= */

console.log("[DASHBOARD] Caricato");

// SESSIONE
function getToken() {
  return localStorage.getItem("session") || "";
}

function setToken(t) {
  if (t) {
    console.log("[DASHBOARD] Salvo nuovo token:", t);
    localStorage.setItem("session", t);
  }
}

function setEmail(e) {
  if (e) {
    console.log("[DASHBOARD] Salvo nuova email:", e);
    localStorage.setItem("email", e);
  }
}

let email = localStorage.getItem("email");
let token = getToken();

console.log("[DASHBOARD] Token iniziale:", token);
console.log("[DASHBOARD] Email iniziale:", email);

// LOGIN CHECK
if (!token || !email) {
  console.log("[DASHBOARD] Nessun token/email → redirect login");
  window.location.href = "login.html?redirect=dashboard.html";
  return;
}

// UI
const userEmailEl = document.getElementById("userEmail");
const usernameEl = document.getElementById("username");
const sidebarEmail = document.getElementById("sidebarEmail");
const sidebarUsername = document.getElementById("sidebarUsername");

function refreshUI() {
  email = localStorage.getItem("email");
  const username = email.split("@")[0];

  if (userEmailEl) userEmailEl.textContent = email;
  if (usernameEl) usernameEl.textContent = username;
  if (sidebarEmail) sidebarEmail.textContent = email;
  if (sidebarUsername) sidebarUsername.textContent = "@" + username;

  console.log("[DASHBOARD] UI aggiornata per:", email);
}

refreshUI();

function setMsg(id, text, ok = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove("ok", "err");
  el.classList.add(ok ? "ok" : "err");
}

/* =========================================================
   NAVIGAZIONE
========================================================= */
document.getElementById("nav-download")?.addEventListener("click", () => {
  window.location.href = "download.html";
});

document.getElementById("nav-ordini")?.addEventListener("click", () => {
  window.location.href = "ordini.html";
});

document.getElementById("nav-logout")?.addEventListener("click", () => {
  console.log("[DASHBOARD] Logout manuale");
  localStorage.clear();
  window.location.href = "index.html";
});

document.getElementById("nav-elimina")?.addEventListener("click", () => {
  document.getElementById("passwordDelete")?.focus();
});

/* =========================================================
   CAMBIO EMAIL — VERSIONE SQL CORRETTA
========================================================= */
document.getElementById("btnCambiaEmail")?.addEventListener("click", async () => {
  const nuova_email = document.getElementById("newEmail").value.trim().toLowerCase();
  const password = document.getElementById("passwordEmail").value.trim();

  if (!nuova_email || !password) {
    setMsg("msgEmail", "Compila tutti i campi.");
    return;
  }

  console.log("[DASHBOARD] Cambio email → invio dati");

  try {
    const res = await fetch("/api/utenti/cambia-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nuova_email,
        password,
        token
      })
    });

    const data = await res.json();
    console.log("[DASHBOARD] Risposta cambio email:", data);

    if (!data.success) {
      setMsg("msgEmail", data.error || "Errore.");
      return;
    }

    setEmail(nuova_email);
    refreshUI();

    setMsg("msgEmail", "Email aggiornata!", true);

  } catch (err) {
    console.log("[DASHBOARD] Errore cambio email:", err);
    setMsg("msgEmail", "Errore di connessione.");
  }
});

/* =========================================================
   CAMBIO PASSWORD — VERSIONE SQL CORRETTA
========================================================= */
document.getElementById("btnCambiaPassword")?.addEventListener("click", async () => {
  const password_attuale = document.getElementById("oldPassword").value.trim();
  const nuova_password = document.getElementById("newPassword").value.trim();

  if (!password_attuale || !nuova_password) {
    setMsg("msgPassword", "Compila tutti i campi.");
    return;
  }

  console.log("[DASHBOARD] Cambio password → invio dati");

  try {
    const res = await fetch("/api/utenti/cambia-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: password_attuale,
        nuova_password,
        token
      })
    });

    const data = await res.json();
    console.log("[DASHBOARD] Risposta cambio password:", data);

    if (!data.success) {
      setMsg("msgPassword", data.error || "Errore.");
      return;
    }

    setMsg("msgPassword", "Password aggiornata!", true);

  } catch (err) {
    console.log("[DASHBOARD] Errore cambio password:", err);
    setMsg("msgPassword", "Errore di connessione.");
  }
});

/* =========================================================
   ELIMINA ACCOUNT — VERSIONE SQL CORRETTA
========================================================= */
document.getElementById("btnEliminaAccount")?.addEventListener("click", async () => {
  const password = document.getElementById("passwordDelete").value.trim();

  if (!password) {
    setMsg("msgElimina", "Inserisci la password.");
    return;
  }

  if (!confirm("Sei sicuro di voler eliminare definitivamente il tuo account?")) {
    return;
  }

  console.log("[DASHBOARD] Eliminazione account → invio dati");

  try {
    const res = await fetch("/api/utenti/elimina-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        token
      })
    });

    const data = await res.json();
    console.log("[DASHBOARD] Risposta eliminazione:", data);

    if (!data.success) {
      setMsg("msgElimina", data.error || "Errore.");
      return;
    }

    localStorage.clear();
    setMsg("msgElimina", "Account eliminato.", true);

    setTimeout(() => {
      window.location.href = "registrazione.html";
    }, 1000);

  } catch (err) {
    console.log("[DASHBOARD] Errore eliminazione:", err);
    setMsg("msgElimina", "Errore di connessione.");
  }
});
