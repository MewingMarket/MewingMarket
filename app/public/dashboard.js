/* =========================================================
   FILE: /public/dashboard.js
   DASHBOARD PREMIUM — MewingMarket
   Versione corretta: sessione unificata + profilo stabile
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  function getSession() {
    return localStorage.getItem("session") || "";
  }

  function setSession(t) {
    if (t) localStorage.setItem("session", t);
  }

  function setEmail(e) {
    if (e) localStorage.setItem("utenteEmail", e);
  }

  let email = localStorage.getItem("utenteEmail");

  // LOGIN CHECK
  if (!getSession() || !email) {
    window.location.href = "login.html";
    return;
  }

  const userEmailEl = document.getElementById("userEmail");
  const usernameEl = document.getElementById("username");
  const sidebarEmail = document.getElementById("sidebarEmail");
  const sidebarUsername = document.getElementById("sidebarUsername");

  function refreshUI() {
    email = localStorage.getItem("utenteEmail");
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

  // NAV
  document.getElementById("nav-download")?.addEventListener("click", () => {
    window.location.href = "download.html";
  });

  document.getElementById("nav-ordini")?.addEventListener("click", () => {
    window.location.href = "ordini.html";
  });

  document.getElementById("nav-logout")?.addEventListener("click", () => {
    localStorage.removeItem("session");
    localStorage.removeItem("utenteEmail");
    window.location.href = "login.html";
  });

  document.getElementById("nav-elimina")?.addEventListener("click", () => {
    document.getElementById("passwordDelete")?.focus();
  });

  // CAMBIO EMAIL
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
          token: getSession(),
          nuova_email,
          password
        })
      });

      const data = await res.json();

      if (!data.success) {
        setMsg("msgEmail", data.error || "Errore.");
        return;
      }

      // LOGIN INVISIBILE
      const resLogin = await fetch("/api/utenti/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nuova_email, password })
      });

      const loginData = await resLogin.json();

      if (loginData.success && loginData.token) {
        setSession(loginData.token);
        setEmail(nuova_email);
      }

      refreshUI();
      setMsg("msgEmail", "Email aggiornata!", true);

    } catch {
      setMsg("msgEmail", "Errore di connessione.");
    }
  });

  // CAMBIO PASSWORD
  document.getElementById("btnCambiaPassword")?.addEventListener("click", async () => {
    const oldPassword = document.getElementById("oldPassword").value.trim();
    const nuova_password = document.getElementById("newPassword").value.trim();

    if (!oldPassword || !nuova_password) {
      setMsg("msgPassword", "Compila tutti i campi.");
      return;
    }

    try {
      const resLogin = await fetch("/api/utenti/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: oldPassword })
      });

      const loginData = await resLogin.json();

      if (!loginData.success) {
        setMsg("msgPassword", "Password attuale errata.");
        return;
      }

      const newToken = loginData.token;
      setSession(newToken);

      const res = await fetch("/api/utenti/cambia-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: newToken,
          nuova_password
        })
      });

      const data = await res.json();

      if (data.success) {
        setMsg("msgPassword", "Password aggiornata!", true);
      } else {
        setMsg("msgPassword", data.error || "Errore.");
      }

    } catch {
      setMsg("msgPassword", "Errore di connessione.");
    }
  });

  // ELIMINA ACCOUNT
  document.getElementById("btnEliminaAccount")?.addEventListener("click", async () => {
    const password = document.getElementById("passwordDelete").value.trim();

    if (!password) {
      setMsg("msgElimina", "Inserisci la password per confermare.");
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
          token: getSession(),
          password
        })
      });

      const data = await res.json();

      if (data.success) {
        setMsg("msgElimina", "Account eliminato. Verrai reindirizzato...", true);

        localStorage.removeItem("session");
        localStorage.removeItem("utenteEmail");

        setTimeout(() => {
          window.location.href = "registrazione.html";
        }, 1000);
      } else {
        setMsg("msgElimina", data.error || "Errore.");
      }

    } catch {
      setMsg("msgElimina", "Errore di connessione.");
    }
  });
});
