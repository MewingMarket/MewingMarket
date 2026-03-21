// =========================================================
// RESET PASSWORD REQUEST — Versione ZERO-INPUT (2026.20)
// Public route — nessun token, nessun input richiesto
// Flusso: request → redirect immediato a confirm
// =========================================================

console.log("[RESET-PASSWORD-REQ] Versione ZERO-INPUT caricata");

const btnResetPassword = document.getElementById("btnResetPassword");
const msgResetPassword = document.getElementById("msgResetPassword");

btnResetPassword?.addEventListener("click", async () => {
  const msg = msgResetPassword;

  if (!msg) return;

  // Protezione doppio click
  if (btnResetPassword.disabled) return;
  btnResetPassword.disabled = true;

  try {
    console.log("[RESET-PASSWORD-REQ] Invio richiesta ZERO-INPUT…");

    const res = await fetch("/api/utenti/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})   // ZERO-INPUT
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-PASSWORD-REQ] Risposta:", data);

    if (data.success) {
      // Redirect immediato alla pagina di conferma
      window.location.href = "reset-password-confirm.html";
      return;
    }

    msg.textContent = data.error || "Errore durante la richiesta di reset password.";
    msg.className = "err";

  } catch (err) {
    console.error("[RESET-PASSWORD-REQ] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnResetPassword.disabled = false;
  }
});
