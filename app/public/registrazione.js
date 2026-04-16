/* =========================================================
   REGISTER — MewingMarket (PATCH 2027.300)
   - Usa fetchCritico globale + API alias
   - Nessuna regressione
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const statusBox = document.getElementById("status");

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect") || "dashboard.html";

  // ⭐ Entrata in flusso sensibile
  localStorage.setItem("sessionState", "2");

  /* =========================================================
     PATCH — Helper per registrare evento utente
  ========================================================== */
  async function logUserEvent(evento) {
    try {
      const email = localStorage.getItem("email") || "";
      if (!email) return;

      await window.fetchCritico(
        "/utenti/evento",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, evento })
        },
        { retries: 2, backoffMs: 300 }
      );

    } catch (err) {
      console.warn("Log evento fallito:", err);
    }
  }

  /* =========================================================
     SUBMIT REGISTRAZIONE
  ========================================================== */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!statusBox) return;

    statusBox.style.color = "#d00";
    statusBox.textContent = "Registrazione in corso...";

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();
    const codice_fiscale = form.codice_fiscale.value.trim().toUpperCase();

    // VALIDAZIONI BASE
    if (!email || !password || !confirmPassword || !codice_fiscale) {
      statusBox.textContent = "Compila tutti i campi.";
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      statusBox.textContent = "Inserisci un'email valida.";
      return;
    }

    if (password.length < 8) {
      statusBox.textContent = "La password deve contenere almeno 8 caratteri.";
      return;
    }

    if (password !== confirmPassword) {
      statusBox.textContent = "Le password non coincidono.";
      return;
    }

    if (codice_fiscale.length !== 16) {
      statusBox.textContent = "Il codice fiscale deve contenere 16 caratteri.";
      return;
    }

    // Protezione doppio click
    if (form.dataset.lock === "1") return;
    form.dataset.lock = "1";

    try {
      // ⭐ PATCH 2027.300 — usa fetchCritico globale + alias API
      const res = await window.fetchCritico(
        "/utenti/registrazione",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, codice_fiscale })
        },
        { retries: 2, backoffMs: 300 }
      );

      const data = await res.json().catch(() => ({}));
      console.log("[REGISTER]", data);

      if (data.error === "Email gia registrata") {
        statusBox.textContent = "Email già registrata. Effettua il login.";
        statusBox.style.color = "#d00";
        form.dataset.lock = "0";
        return;
      }

      if (!data.success) {
        statusBox.textContent = data.error || "Errore durante la registrazione.";
        form.dataset.lock = "0";
        return;
      }

      /* =====================================================
         SALVATAGGIO CORRETTO token/email/ruolo
      ===================================================== */
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", email);
        localStorage.setItem("ruolo", "user");

        // Sessione attiva
        localStorage.setItem("sessionState", "1");
      }

      // ⭐ PATCH EVENTO: registra registrazione
      logUserEvent("registrato");

      statusBox.style.color = "green";
      statusBox.textContent = "Registrazione completata! Reindirizzamento...";

      setTimeout(() => {
        window.location.href = redirect;
      }, 800);

    } catch (err) {
      console.error(err);
      statusBox.textContent = "Errore di connessione.";
    } finally {
      form.dataset.lock = "0";
    }
  });
});
