document.getElementById("btnResetPassword").addEventListener("click", async () => {
  const email = document.getElementById("resetEmail").value.trim().toLowerCase();
  const msg = document.getElementById("msgResetPassword");

  if (!email) {
    msg.textContent = "Inserisci la tua email.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/utenti/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    console.log("[RESET PASSWORD REQUEST]", data);

    if (data.success) {
      msg.textContent = "Email inviata! Controlla la tua casella.";
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
