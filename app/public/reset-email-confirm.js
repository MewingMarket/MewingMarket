// =========================================================
// RESET EMAIL CONFIRM — Versione DEFINITIVA (2026)
// Public route — nessun token auth richiesto
// =========================================================

console.log("[RESET-EMAIL-CONFIRM] Caricato");

// Recupero token dalla URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

const btnConfirmEmail = document.getElementById("btnConfirmEmail");
const msgConfirmEmail = document.getElementById("msgConfirmEmail");

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
    console.log("[RESET-EMAIL-CONFIRM] Invio conferma reset email…");

    const res = await fetch("/api/utenti/reset-email-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nuova_email })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-EMAIL-CONFIRM] Risposta:", data);

    if (data.success) {
      msg.textContent = "Email aggiornata! Verrai reindirizzato al login…";
      msg.className = "ok";

      // Logout forzato per sicurezza
      localStorage.removeItem("sessione");
      localStorage.removeItem("email");
      localStorage.removeItem("ruolo");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

      return;
    }

    msg.textContent = data.error || "Errore durante la conferma del reset email.";
    msg.className = "err";

  } catch (err) {
    console.error("[RESET-EMAIL-CONFIRM] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnConfirmEmail.disabled = false;
  }
});
