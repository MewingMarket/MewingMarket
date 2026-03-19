// =========================================================
// RESET EMAIL REQUEST — Versione compatibile backend SQL
// + patch: doppio click, 401, messaggi
// =========================================================

const btnResetEmail = document.getElementById("btnResetEmail");
const msgResetEmail = document.getElementById("msgResetEmail");

btnResetEmail?.addEventListener("click", async () => {
  const password = document.getElementById("resetPass")?.value.trim();
  const msg = msgResetEmail;

  const session = localStorage.getItem("session"); // token SQL

  if (!msg) return;

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

  // Protezione doppio click
  if (btnResetEmail.disabled) return;
  btnResetEmail.disabled = true;

  try {
    const res = await fetch("/api/utenti/reset-email-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-token": session
      },
      body: JSON.stringify({ password })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET EMAIL REQUEST]", data);

    if (res.status === 401) {
      msg.textContent = "Sessione scaduta. Effettua di nuovo il login.";
      msg.className = "err";
      return;
    }

    if (data.success) {
      msg.textContent = "Email inviata! Controlla la tua casella.";
      msg.className = "ok";
    } else {
      msg.textContent = data.error || "Errore durante la richiesta di reset email.";
      msg.className = "err";
    }

  } catch (err) {
    console.error(err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnResetEmail.disabled = false;
  }
});
