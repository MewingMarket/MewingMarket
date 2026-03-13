/* =========================================================
   FILE: /public/dashboard.js
   DASHBOARD — Compatibile al 100% con il backend reale (SQL)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  // SESSIONE
  function getToken() {
    return localStorage.getItem("session") || "";
  }

  function setToken(t) {
    if (t) localStorage.setItem("session", t);
  }

  function setEmail(e) {
    if (e) localStorage.setItem("email", e);
  }

  let email = localStorage.getItem("email");
  let token = getToken();

  // LOGIN CHECK
  if (!token || !email) {
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
  }

  refreshUI();

  function setMsg(id, text, ok = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove("ok", "err");
    el.classList.add(ok ? "ok" : "err");
  }

  // NAVIGAZIONE
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

  document.getElementById("nav-elimina")?.addEventListener("click", () => {
    document.getElementById("passwordDelete")?.focus();
  });

  // =========================================================
  // CAMBIO EMAIL — PATCH SQL COMPLETA
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,          // PATCH: email inviata
          password,       // PATCH: password attuale
          nuova_email,    // nuova email
          token           // token sessione
        })
      });

      const data = await res.json();

      if (!data.success) {
        setMsg("msgEmail", data.error || "Errore.");
        return;
      }

      // PATCH: aggiorna email locale
      setEmail(nuova_email);
      refreshUI();

      setMsg("msgEmail", "Email aggiornata!", true);

    } catch {
      setMsg("msgEmail", "Errore di connessione.");
    }
  });

  // =========================================================
  // CAMBIO PASSWORD — PATCH SQL COMPLETA
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,             // PATCH: email inviata
          password_attuale,  // PATCH: password attuale
          nuova_password,    // PATCH: nuova password
          token
        })
      });

      const data = await res.json();

      if (!data.success) {
        setMsg("msgPassword", data.error || "Errore.");
        return;
      }

      setMsg("msgPassword", "Password aggiornata!", true);

    } catch {
      setMsg("msgPassword", "Errore di connessione.");
    }
  });

  // =========================================================
  // ELIMINA ACCOUNT — COMPATIBILE CON SQL
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,     // PATCH: email inviata
          password,  // PATCH: password attuale
          token
        })
      });

      const data = await res.json();

      if (!data.success) {
        setMsg("msgElimina", data.error || "Errore.");
        return;
      }

      localStorage.clear();
      setMsg("msgElimina", "Account eliminato.", true);

      setTimeout(() => {
        window.location.href = "registrazione.html";
      }, 1000);

    } catch {
      setMsg("msgElimina", "Errore di connessione.");
    }
  });

});
