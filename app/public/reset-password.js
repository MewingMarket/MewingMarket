// =========================================================
// RESET PASSWORD REQUEST — Versione DEFINITIVA (2026)
// Public route — nessun token richiesto
// =========================================================

console.log("[RESET-PASSWORD-REQ] Caricato");

const btnResetPassword = document.getElementById("btnResetPassword");
const msgResetPassword = document.getElementById("msgResetPassword");

btnResetPassword?.addEventListener("click", async () => {
  const email = document.getElementById("resetEmail")?.value.trim().toLowerCase();
  const msg = msgResetPassword;

  if (!msg) return;

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

  // Protezione doppio click
  if (btnResetPassword.disabled) return;
  btnResetPassword.disabled = true;

  try {
    console.log("[RESET-PASSWORD-REQ] Invio richiesta…");

    const res = await fetch("/api/utenti/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-PASSWORD-REQ] Risposta:", data);

    if (data.success) {
      msg.textContent = "Email inviata! Controlla la tua casella.";
      msg.className = "ok";
    } else {
      msg.textContent = data.error || "Errore durante la richiesta di reset password.";
      msg.className = "err";
    }

  } catch (err) {
    console.error("[RESET-PASSWORD-REQ] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnResetPassword.disabled = false;
  }
});
