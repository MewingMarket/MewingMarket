// =========================================================
// RESET PASSWORD REQUEST — Versione compatibile backend SQL
// =========================================================

document.getElementById("btnResetPassword").addEventListener("click", async () => {
  const email = document.getElementById("resetEmail").value.trim().toLowerCase();
  const msg = document.getElementById("msgResetPassword");

  // Validazione email
  if (!email) {
    msg.textContent = "Inserisci la tua email.";
    msg.className = "err";
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    msg.textContent = "Inserisci un'email valida.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/auth/reset-password-request", {
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

  } catch (err) {
    console.error(err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  }
});
