/* =========================================================
   RESET PASSWORD CONFIRM — Versione ZERO-INPUT (PATCH 2027.400)
   - critical-ready
   - fetchUniversale (fallback chain)
   - Nessuna regressione
========================================================= */

console.log("[RESET-PASS-CONFIRM] Versione ZERO-INPUT caricata");

document.addEventListener("critical-ready", () => {
  const btnConfirmReset = document.getElementById("btnConfirmReset");
  const msgConfirmReset = document.getElementById("msgConfirmReset");

  btnConfirmReset?.addEventListener("click", async () => {
    const nuova_password = document.getElementById("newPassword")?.value.trim();
    const conferma = document.getElementById("confirmPassword")?.value.trim();
    const codice_fiscale = localStorage.getItem("cf_reset"); // ZERO-INPUT
    const msg = msgConfirmReset;

    if (!msg) return;

    if (!nuova_password || !conferma) {
      msg.textContent = "Compila tutti i campi.";
      msg.className = "err";
      return;
    }

    if (!codice_fiscale || codice_fiscale.length !== 16) {
      msg.textContent = "Errore interno: codice fiscale mancante.";
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

      const res = await window.fetchUniversale(
        "/utenti/reset-password-confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nuova_password, codice_fiscale })
        },
        { retries: 2, backoffMs: 300 }
      );

      const data = await res.json().catch(() => ({}));
      console.log("[RESET-PASS-CONFIRM] Risposta:", data);

      if (data.success) {

        // 🔥 PULIZIA CF
        localStorage.removeItem("cf_reset");

        // 🔥 FIX CHECKOUT — salviamo token + email + sessionState
        if (data.token && data.email) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("email", data.email);
          localStorage.setItem("sessionState", "1");
        } else {
          localStorage.setItem("sessionState", "1");
        }

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
});
