// =========================================================
// RESET EMAIL CONFIRM — Versione compatibile backend SQL
// =========================================================

// Recupero token dalla URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

// Bottone conferma email
document.getElementById("btnConfirmEmail").addEventListener("click", async () => {
  const nuova_email = document.getElementById("newEmail").value.trim().toLowerCase();
  const msg = document.getElementById("msgConfirmEmail");

  // Validazione email
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

  // Validazione token
  if (!token) {
    msg.textContent = "Token mancante o non valido.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/auth/reset-email-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nuova_email })
    });

    const data = await res.json();
    console.log("[RESET EMAIL CONFIRM]", data);

    if (data.success) {

      // ⭐ Aggiorna email utente
      localStorage.setItem("utenteEmail", nuova_email);

      // ⭐ Invalida sessione (obbligatorio)
      localStorage.removeItem("session");

      msg.textContent = "Email aggiornata correttamente! Verrai reindirizzato al login...";
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
