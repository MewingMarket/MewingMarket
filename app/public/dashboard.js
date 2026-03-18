/* =========================================================
   FILE: /public/dashboard.js
   DASHBOARD — Versione DEFINITIVA per backend SQL
========================================================= */

console.log("[DASHBOARD] Caricato");

// =========================================================
// SESSIONE
// =========================================================

function getSession() {
  return localStorage.getItem("session") || "";
}

function getEmail() {
  return localStorage.getItem("email") || "";
}

function setEmail(e) {
  if (e) {
    localStorage.setItem("email", e);
  }
}

let session = getSession();
let email = getEmail();

console.log("[DASHBOARD] Session:", session);
console.log("[DASHBOARD] Email:", email);

// LOGIN CHECK
if (!session || !email) {
  window.location.href = "login.html?redirect=dashboard.html";
  return;
}

// =========================================================
// UI
// =========================================================

const userEmailEl = document.getElementById("userEmail");
const usernameEl = document.getElementById("username");
const sidebarEmail = document.getElementById("sidebarEmail");
const sidebarUsername = document.getElementById("sidebarUsername");

function refreshUI() {
  email = getEmail();
  const username = email.split("@")[0];

  if (userEmailEl) userEmailEl.textContent = email;
  if (usernameEl) usernameEl.textContent = username;
  if (sidebarEmail) sidebarEmail.textContent = email;
  if (sidebarUsername) sidebarUsername.textContent = "@" + username;

  console.log("[DASHBOARD] UI aggiornata:", email);
}

refreshUI();

function setMsg(id, text, ok = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove("ok", "err");
  el.classList.add(ok ? "ok" : "err");
}

// =========================================================
// NAVIGAZIONE
// =========================================================

document.getElementById("nav-download")?.addEventListener("click", () => {
  window.location.href = "download.html";
});

document.getElementById("nav-ordini")?.addEventListener("click", () => {
  window.location.href = "ordini.html";
});

document.getElementById("nav-logout")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// =========================================================
// CAMBIO EMAIL — SQL READY
// =========================================================

document.getElementById("btnCambiaEmail")?.addEventListener("click", async () => {
  const nuova_email = document.getElementById("newEmail").value.trim().toLowerCase();
  const password = document.getElementById("passwordEmail").value.trim();

  if (!nuova_email || !password) {
    setMsg("msgEmail", "Compila tutti i campi.");
    return;
  }

  try {
    const res = await fetch("/api/utenti/cambia-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-token": session
      },
      body: JSON.stringify({ nuova_email, password })
    });

    const data = await res.json();
    console.log("[DASHBOARD] Cambio email:", data);

    if (!data.success) {
      setMsg("msgEmail", data.error || "Errore.");
      return;
    }

    setEmail(nuova_email);
    refreshUI();
    setMsg("msgEmail", "Email aggiornata!", true);

  } catch (err) {
    console.error(err);
    setMsg("msgEmail", "Errore di connessione.");
  }
});

// =========================================================
// CAMBIO PASSWORD — SQL READY
// =========================================================

document.getElementById("btnCambiaPassword")?.addEventListener("click", async () => {
  const password_attuale = document.getElementById("oldPassword").value.trim();
  const nuova_password = document.getElementById("newPassword").value.trim();

  if (!password_attuale || !nuova_password) {
    setMsg("msgPassword", "Compila tutti i campi.");
    return;
  }

  try {
    const res = await fetch("/api/utenti/cambia-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-token": session
      },
      body: JSON.stringify({ password_attuale, nuova_password })
    });

    const data = await res.json();
    console.log("[DASHBOARD] Cambio password:", data);

    if (!data.success) {
      setMsg("msgPassword", data.error || "Errore.");
      return;
    }

    setMsg("msgPassword", "Password aggiornata!", true);

  } catch (err) {
    console.error(err);
    setMsg("msgPassword", "Errore di connessione.");
  }
});

// =========================================================
// ELIMINA ACCOUNT — SQL READY
// =========================================================

document.getElementById("btnEliminaAccount")?.addEventListener("click", async () => {
  const password = document.getElementById("passwordDelete").value.trim();

  if (!password) {
    setMsg("msgElimina", "Inserisci la password.");
    return;
  }

  if (!confirm("Sei sicuro di voler eliminare definitivamente il tuo account?")) {
    return;
  }

  try {
    const res = await fetch("/api/utenti/elimina-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-token": session
      },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    console.log("[DASHBOARD] Eliminazione account:", data);

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
    console.error(err);
    setMsg("msgElimina", "Errore di connessione.");
  }
});
