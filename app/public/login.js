/* =========================================================
   FILE: /public/login.js
   LOGIN — Versione definitiva e compatibile con AUTH.JS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const statusBox = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();

    if (!email || !password) {
      statusBox.textContent = "Compila tutti i campi.";
      return;
    }

    statusBox.textContent = "Accesso in corso...";

    try {
      const res = await fetch("/api/utenti/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        statusBox.textContent = data.error || "Credenziali errate.";
        return;
      }

      /* =========================================================
         SALVATAGGIO COMPLETO (compatibile con AUTH.JS)
      ========================================================== */
      localStorage.setItem("session", data.token);
      localStorage.setItem("email", email);

      // NUOVO — compatibilità futura
      localStorage.setItem("token", data.token);
      localStorage.setItem("utenteEmail", email);

      /* =========================================================
         ATTIVA POPUP POST-LOGIN
      ========================================================== */
      localStorage.setItem("showLoginChoice", "1");

      /* =========================================================
         REDIRECT
      ========================================================== */
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");

      window.location.href = redirect || "index.html";

    } catch (err) {
      statusBox.textContent = "Errore di connessione.";
    }
  });
});
