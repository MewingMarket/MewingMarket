/* =========================================================
   FILE: /public/login.js
   LOGIN PREMIUM — MewingMarket
   Versione corretta: salva sessione compatibile con tutto il sito
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const statusBox = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusBox.style.color = "#d00";
    statusBox.textContent = "Accesso in corso...";

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();

    if (!email || !password) {
      statusBox.textContent = "Compila tutti i campi.";
      return;
    }

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

      // 🔥 FIX: salva la sessione nel formato usato da tutto il sito
      localStorage.setItem("session", data.token);
      localStorage.setItem("utenteEmail", email);

      if (typeof aggiornaFooterUtente === "function") {
        aggiornaFooterUtente();
      }

      statusBox.style.color = "green";
      statusBox.textContent = "Accesso effettuato! Reindirizzamento...";

      setTimeout(() => {
        // Se c'è redirect, torna alla pagina precedente
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");

        if (redirect) {
          window.location.href = redirect;
        } else {
          window.location.href = "dashboard.html";
        }
      }, 800);

    } catch (err) {
      console.error(err);
      statusBox.textContent = "Errore di connessione.";
    }
  });
});
