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

    if (!email.includes("@") || !email.includes(".")) {
      statusBox.textContent = "Inserisci un'email valida.";
      return;
    }

    if (password.length < 6) {
      statusBox.textContent = "La password deve contenere almeno 6 caratteri.";
      return;
    }

    if (password !== confirmPassword) {
      statusBox.textContent = "Le password non coincidono.";
      return;
    }

    try {
      // INVIO AL NUOVO BACKEND
      const res = await fetch("/api/utenti/registrazione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        statusBox.textContent = data.error || "Errore durante la registrazione.";
        return;
      }

      // SUCCESSO → SALVA TOKEN
      if (data.token) {
        localStorage.setItem("user_token", data.token);
      }

      statusBox.style.color = "green";
      statusBox.textContent = "Registrazione completata! Reindirizzamento...";

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1200);

    } catch (err) {
      console.error(err);
      statusBox.textContent = "Errore di connessione.";
    }
  });
});
