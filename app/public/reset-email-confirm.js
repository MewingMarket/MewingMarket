const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

document.getElementById("btnConfirmEmail").addEventListener("click", async () => {
  const nuova_email = document.getElementById("newEmail").value.trim().toLowerCase();
  const msg = document.getElementById("msgConfirmEmail");

  if (!nuova_email) {
    msg.textContent = "Inserisci la nuova email.";
    msg.className = "err";
    return;
  }

  if (!nuova_email.includes("@") || !nuova_email.includes(".")) {
    msg.textContent = "Inserisci un'email valida.";
    msg.className = "err";
    return;
  }

  if (!token) {
    msg.textContent = "Token mancante o non valido.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/utenti/reset-email-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nuova_email })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Email aggiornata correttamente!";
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
