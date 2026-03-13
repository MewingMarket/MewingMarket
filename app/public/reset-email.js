document.getElementById("btnResetEmail").addEventListener("click", async () => {
  const password = document.getElementById("resetPass").value.trim();
  const msg = document.getElementById("msgResetEmail");
  const token = localStorage.getItem("session"); // ⭐ PATCH

  if (!password) {
    msg.textContent = "Inserisci la password.";
    msg.className = "err";
    return;
  }

  if (!token) {
    msg.textContent = "Token mancante. Devi rifare il login.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/utenti/reset-email-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        token   // ⭐ PATCH: invio token al backend
      })
    });

    const data = await res.json();
    console.log("[RESET EMAIL REQUEST]", data);

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
