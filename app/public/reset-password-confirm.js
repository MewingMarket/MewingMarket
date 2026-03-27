// =========================================================
// RESET PASSWORD CONFIRM — Versione ZERO-INPUT (2026.40)
// PATCH: sessionState = 1 + INVIO CF
// =========================================================

console.log("[RESET-PASS-CONFIRM] Versione ZERO-INPUT caricata");

const btnConfirmReset = document.getElementById("btnConfirmReset");
const msgConfirmReset = document.getElementById("msgConfirmReset");

btnConfirmReset?.addEventListener("click", async () => {
  const nuova_password = document.getElementById("newPassword")?.value.trim();
  const conferma = document.getElementById("confirmPassword")?.value.trim();
  const codice_fiscale = document.getElementById("cf")?.value.trim().toUpperCase();
  const msg = msgConfirmReset;

  if (!msg) return;

  if (!nuova_password || !conferma || !codice_fiscale) {
    msg.textContent = "Compila tutti i campi.";
    msg.className = "err";
    return;
  }

  if (codice_fiscale.length !== 16) {
    msg.textContent = "Codice fiscale non valido.";
    msg.className = "err";
    return;
  }

  if (nuova_password !== conferma) {
    msg.textContent = "Le password non coincidono.";
    msg.className = "err";
    return;
  }

  if (nuova_password.length < 8) {
    msg.textContent = "La password deve avere almeno 8 caratteri.";
    msg.className = "err";
    return;
  }

  if (btnConfirmReset.disabled) return;
  btnConfirmReset.disabled = true;

  try {
    console.log("[RESET-PASS-CONFIRM] Invio conferma ZERO-INPUT…");

    const res = await fetch("/api/utenti/reset-password-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuova_password, codice_fiscale })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-PASS-CONFIRM] Risposta:", data);

    if (data.success) {
      localStorage.setItem("sessionState", "1");
      window.location.href = "login.html";
      return;
    }

    msg.textContent = data.error || "Errore durante la conferma del reset password.";
    msg.className = "err";

  } catch (err) {
    console.error("[RESET-PASS-CONFIRM] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnConfirmReset.disabled = false;
  }
});
