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

      // Salva token + email
      localStorage.setItem("token", data.token);
      localStorage.setItem("utenteEmail", email);

      if (typeof aggiornaFooterUtente === "function") {
        aggiornaFooterUtente();
      }

      statusBox.style.color = "green";
      statusBox.textContent = "Accesso effettuato! Reindirizzamento...";

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);

    } catch (err) {
      console.error(err);
      statusBox.textContent = "Errore di connessione.";
    }
  });
});
