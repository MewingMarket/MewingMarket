// =========================================================
// RESET EMAIL REQUEST — Versione DEFINITIVA (2026)
// Public route — nessun token richiesto
// =========================================================

console.log("[RESET-EMAIL-REQ] Caricato");

const btnResetEmail = document.getElementById("btnResetEmail");
const msgResetEmail = document.getElementById("msgResetEmail");

btnResetEmail?.addEventListener("click", async () => {
  const email = document.getElementById("email")?.value.trim().toLowerCase();
  const msg = msgResetEmail;

  if (!msg) return;

  // -------------------------------------------------------
  // Validazione email
  // -------------------------------------------------------
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
  if (btnResetEmail.disabled) return;
  btnResetEmail.disabled = true;

  try {
    console.log("[RESET-EMAIL-REQ] Invio richiesta…");

    const res = await fetch("/api/utenti/reset-email-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-EMAIL-REQ] Risposta:", data);

    if (data.success) {
      msg.textContent = "Email inviata! Controlla la tua casella.";
      msg.className = "ok";
    } else {
      msg.textContent = data.error || "Errore durante la richiesta di reset email.";
      msg.className = "err";
    }

  } catch (err) {
    console.error("[RESET-EMAIL-REQ] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnResetEmail.disabled = false;
  }
});
