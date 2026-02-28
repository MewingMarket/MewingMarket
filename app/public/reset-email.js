document.getElementById("btnResetEmail").addEventListener("click", async () => {
  const password = document.getElementById("resetPass").value.trim();
  const msg = document.getElementById("msgResetEmail");

  if (!password) {
    msg.textContent = "Inserisci la password.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/utenti/reset-email-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

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
