// =========================================================
// RESET EMAIL REQUEST — Versione compatibile backend SQL
// =========================================================

document.getElementById("btnResetEmail").addEventListener("click", async () => {
  const password = document.getElementById("resetPass").value.trim();
  const msg = document.getElementById("msgResetEmail");

  const session = localStorage.getItem("session"); // token SQL

  // Validazione password
  if (!password) {
    msg.textContent = "Inserisci la password.";
    msg.className = "err";
    return;
  }

  // Validazione sessione
  if (!session) {
    msg.textContent = "Sessione mancante. Devi rifare il login.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/utenti/reset-email-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-token": session   // ⭐ token corretto per backend SQL
      },
      body: JSON.stringify({ password })
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

  } catch (err) {
    console.error(err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  }
});
