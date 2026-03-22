// =========================================================
// RESET EMAIL CONFIRM — Versione ZERO-INPUT (2026.21)
// Public route — nessun token richiesto
// Flusso: conferma → update email → redirect login
// =========================================================

console.log("[RESET-EMAIL-CONFIRM] Versione ZERO-INPUT caricata");

const btnConfirmEmail = document.getElementById("btnConfirmEmail");
const msgConfirmEmail = document.getElementById("msgConfirmEmail");

btnConfirmEmail?.addEventListener("click", async () => {
  const nuova_email = document.getElementById("newEmail")?.value.trim().toLowerCase();
  const msg = msgConfirmEmail;

  if (!msg) return;

  // -------------------------------------------------------
  // 1) Codice dalla query string
  // -------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const codice = params.get("code");

  if (!codice) {
    msg.textContent = "Codice di conferma mancante o non valido.";
    msg.className = "err";
    return;
  }

  // -------------------------------------------------------
  // 2) Codice fiscale (obbligatorio)
  // -------------------------------------------------------
  const codice_fiscale = localStorage.getItem("codice_fiscale");

  if (!codice_fiscale) {
    msg.textContent = "Codice fiscale mancante. Effettua di nuovo il login.";
    msg.className = "err";
    return;
  }

  // -------------------------------------------------------
  // 3) Validazione email
  // -------------------------------------------------------
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

  // Protezione doppio click
  if (btnConfirmEmail.disabled) return;
  btnConfirmEmail.disabled = true;

  try {
    console.log("[RESET-EMAIL-CONFIRM] Invio conferma ZERO-INPUT…");

    const res = await fetch("/api/utenti/reset-email-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nuova_email,
        codice,
        codice_fiscale
      })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-EMAIL-CONFIRM] Risposta:", data);

    if (data.success) {
      // Il backend restituisce token + email SOLO nel reset email
      if (data.token && data.email) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
      }

      // Redirect immediato al login (pre-login flow)
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
