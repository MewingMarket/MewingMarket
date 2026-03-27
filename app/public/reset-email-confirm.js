// =========================================================
// RESET EMAIL CONFIRM — Versione ZERO-INPUT (2026.60)
// PATCH: nuova sessione + token/email + sessionState = 1
// =========================================================

console.log("[RESET-EMAIL-CONFIRM] Versione ZERO-INPUT caricata");

const btnConfirmEmail = document.getElementById("btnConfirmEmail");
const msgConfirmEmail = document.getElementById("msgConfirmEmail");

btnConfirmEmail?.addEventListener("click", async () => {
  const nuova_email = document.getElementById("newEmail")?.value.trim().toLowerCase();
  const codice_fiscale = localStorage.getItem("cf_reset"); // ZERO-INPUT
  const msg = msgConfirmEmail;

  if (!msg) return;

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

  if (!codice_fiscale || codice_fiscale.length !== 16) {
    msg.textContent = "Errore interno: codice fiscale mancante.";
    msg.className = "err";
    return;
  }

  if (btnConfirmEmail.disabled) return;
  btnConfirmEmail.disabled = true;

  try {
    console.log("[RESET-EMAIL-CONFIRM] Invio conferma ZERO-INPUT…");

    const res = await fetch("/api/utenti/reset-email-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuova_email, codice_fiscale })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-EMAIL-CONFIRM] Risposta:", data);

    if (data.success) {

      // 🔥 PULIZIA CF
      localStorage.removeItem("cf_reset");

      // 🔥 FIX CHECKOUT — salviamo token + email + sessionState
      if (data.token && data.email) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
        localStorage.setItem("sessionState", "1");
      } else {
        // fallback (non dovrebbe servire)
        localStorage.setItem("sessionState", "1");
      }

      window.location.href = "login.html";
      return;
    }

    msg.textContent = data.error || "Errore durante la conferma del cambio email.";
    msg.className = "err";

  } catch (err) {
    console.error("[RESET-EMAIL-CONFIRM] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnConfirmEmail.disabled = false;
  }
});
