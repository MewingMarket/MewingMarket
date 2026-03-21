// =========================================================
// REGISTER — MewingMarket (SQL READY)
// Versione DEFINITIVA PATCHATA (2026.10)
// Compatibile con auth.js + sessionState
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const statusBox = document.getElementById("status");

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect") || "dashboard.html";

  // ⭐ PATCH 2026.10 — Entrata in flusso sensibile
  // (registrazione = sessionState 2)
  localStorage.setItem("sessionState", "2");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!statusBox) return;

    statusBox.style.color = "#d00";
    statusBox.textContent = "Registrazione in corso...";

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    // VALIDAZIONI BASE
    if (!email || !password || !confirmPassword) {
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

    // Protezione doppio click
    if (form.dataset.lock === "1") return;
    form.dataset.lock = "1";

    try {
      const res = await fetch("/api/utenti/registrazione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      console.log("[REGISTER]", data);

      if (data.error === "Email già registrata") {
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

      // =====================================================
      // ⭐ PATCH 2026.10 — Salvataggio corretto token/email/ruolo
      // =====================================================
      if (data.token) {
        localStorage.setItem("token", data.token);   // ← CORRETTO
        localStorage.setItem("email", email);
        localStorage.setItem("ruolo", "user");

        // ⭐ Dopo registrazione → sessione attiva
        localStorage.setItem("sessionState", "1");
      }

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
