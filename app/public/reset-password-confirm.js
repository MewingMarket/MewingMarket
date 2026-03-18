// =========================================================
// RESET PASSWORD CONFIRM — Versione compatibile backend SQL
// =========================================================

// Recupero token dalla URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

// Bottone conferma reset password
document.getElementById("btnConfirmReset").addEventListener("click", async () => {
  const nuova_password = document.getElementById("newPassword").value.trim();
  const conferma = document.getElementById("confirmPassword").value.trim();
  const msg = document.getElementById("msgConfirmReset");

  // Validazione campi
  if (!nuova_password || !conferma) {
    msg.textContent = "Compila tutti i campi.";
    msg.className = "err";
    return;
  }

  if (nuova_password !== conferma) {
    msg.textContent = "Le password non coincidono.";
    msg.className = "err";
    return;
  }

  // Validazione token
  if (!token) {
    msg.textContent = "Token mancante o non valido.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/utenti/reset-password-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nuova_password })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Password aggiornata! Verrai reindirizzato al login...";
      msg.className = "ok";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

      return;
    } else {
      msg.textContent = data.error || "Errore.";
      msg.className = "err";
    }

  } catch (err) {
    console.error(err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  }
});
