// =========================================================
// RESET EMAIL REQUEST — Versione ZERO-INPUT (2026.20)
// Public route — nessun token, nessun input richiesto
// Flusso: request → redirect immediato a confirm
// =========================================================

console.log("[RESET-EMAIL-REQ] Versione ZERO-INPUT caricata");

const btnResetEmail = document.getElementById("btnResetEmail");
const msgResetEmail = document.getElementById("msgResetEmail");

btnResetEmail?.addEventListener("click", async () => {
  const msg = msgResetEmail;

  if (!msg) return;

  // Protezione doppio click
  if (btnResetEmail.disabled) return;
  btnResetEmail.disabled = true;

  try {
    console.log("[RESET-EMAIL-REQ] Invio richiesta ZERO-INPUT…");

    const res = await fetch("/api/utenti/reset-email-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})   // ZERO-INPUT
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-EMAIL-REQ] Risposta:", data);

    if (data.success) {
      // Redirect immediato alla pagina di conferma
      window.location.href = "reset-email-confirm.html";
      return;
    }

    msg.textContent = data.error || "Errore durante la richiesta di reset email.";
    msg.className = "err";

  } catch (err) {
    console.error("[RESET-EMAIL-REQ] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnResetEmail.disabled = false;
  }
});
