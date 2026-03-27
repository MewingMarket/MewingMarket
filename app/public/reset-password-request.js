// =========================================================
// RESET PASSWORD REQUEST — Versione CF (2026.21) — PATCH
// =========================================================

console.log("[RESET-PASSWORD-REQ] Versione CF caricata");

const btnResetPassword = document.getElementById("btnResetPassword");
const msgResetPassword = document.getElementById("msgResetPassword");

btnResetPassword?.addEventListener("click", async () => {
  const msg = msgResetPassword;
  if (!msg) return;

  const codice_fiscale = document.getElementById("cf")?.value.trim().toUpperCase();

  if (!codice_fiscale || codice_fiscale.length !== 16) {
    msg.textContent = "Inserisci un codice fiscale valido.";
    msg.className = "err";
    return;
  }

  if (btnResetPassword.disabled) return;
  btnResetPassword.disabled = true;

  msg.textContent = "Invio richiesta in corso...";
  msg.className = "msg";

  try {
    console.log("[RESET-PASSWORD-REQ] Invio richiesta con CF…");

    const res = await fetch("/api/utenti/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codice_fiscale })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-PASSWORD-REQ] Risposta:", data);

    if (data.success) {

      // 🔥 QUESTA È LA RIGA CHE MANCAVA
      localStorage.setItem("cf_reset", codice_fiscale);

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
