// =========================================================
// RESET EMAIL CONFIRM — Versione compatibile backend SQL
// + patch: doppio click, 401, messaggi chiari, sicurezza
// =========================================================

// Recupero token dalla URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

const btnConfirmEmail = document.getElementById("btnConfirmEmail");
const msgConfirmEmail = document.getElementById("msgConfirmEmail");

// Bottone conferma email
btnConfirmEmail?.addEventListener("click", async () => {
  const nuova_email = document.getElementById("newEmail")?.value.trim().toLowerCase();
  const msg = msgConfirmEmail;

  if (!msg) return;

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

  // Protezione doppio click
  if (btnConfirmEmail.disabled) return;
  btnConfirmEmail.disabled = true;

  try {
    const res = await fetch("/api/utenti/reset-email-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nuova_email })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET EMAIL CONFIRM]", data);

    // Token scaduto / manipolato
    if (res.status === 401 || data.error === "Token non valido") {
      msg.textContent = "Link non valido o scaduto. Richiedi un nuovo reset email.";
      msg.className = "err";
      return;
    }

    if (data.success) {

      // ⭐ Aggiorna email utente
      localStorage.setItem("email", nuova_email);

      // ⭐ Invalida sessione (obbligatorio)
      localStorage.removeItem("session");
      localStorage.removeItem("ruolo");

      msg.textContent = "Email aggiornata correttamente! Verrai reindirizzato al login...";
      msg.className = "ok";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

      return;
    }

    // Errore generico
    msg.textContent = data.error || "Errore durante la conferma del reset email.";
    msg.className = "err";

  } catch (err) {
    console.error(err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnConfirmEmail.disabled = false;
  }
});
