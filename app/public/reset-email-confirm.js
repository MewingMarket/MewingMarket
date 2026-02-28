const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

document.getElementById("btnConfirmReset").addEventListener("click", async () => {
  const nuova_password = document.getElementById("newPassword").value.trim();
  const conferma = document.getElementById("confirmPassword").value.trim();
  const msg = document.getElementById("msgConfirmReset");

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
      msg.textContent = "Password aggiornata! Ora puoi accedere.";
      msg.className = "ok";
    } else {
      msg.textContent = data.error || "Errore.";
      msg.className = "err";
    }

  } catch {
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  }
});
