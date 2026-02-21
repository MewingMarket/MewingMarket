document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const statusBox = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
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

    // Email semplice
    if (!email.includes("@") || !email.includes(".")) {
      statusBox.textContent = "Inserisci un'email valida.";
      return;
    }

    // Password minima
    if (password.length < 6) {
      statusBox.textContent = "La password deve contenere almeno 6 caratteri.";
      return;
    }

    if (password !== confirmPassword) {
      statusBox.textContent = "Le password non coincidono.";
      return;
    }

    try {
      // INVIO AL BACKEND
      const res = await fetch("/api/utente/registrazione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        statusBox.textContent = data.error || "Errore durante la registrazione.";
        return;
      }

      // SUCCESSO
      statusBox.style.color = "green";
      statusBox.textContent = "Registrazione completata! Reindirizzamento...";

      setTimeout(() => {
        window.location.href = "dashboard-login.html";
      }, 1500);

    } catch (err) {
      console.error(err);
      statusBox.textContent = "Errore di connessione.";
    }
  });
});
