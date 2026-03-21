// =========================================================
// RESET PASSWORD CONFIRM — Versione DEFINITIVA (2026.10)
// Public route — nessun token auth richiesto
// Compatibile con auth.js + sessionState
// =========================================================

console.log("[RESET-PASS-CONFIRM] Caricato");

// Recupero token dalla URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

const btnConfirmReset = document.getElementById("btnConfirmReset");
const msgConfirmReset = document.getElementById("msgConfirmReset");

btnConfirmReset?.addEventListener("click", async () => {
  const nuova_password = document.getElementById("newPassword")?.value.trim();
  const conferma = document.getElementById("confirmPassword")?.value.trim();
  const msg = msgConfirmReset;

  if (!msg) return;

  // Validazione campi
  if (!nuova_password || !conferma) {
    msg.textContent = "Compila tutti i campi.";
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

  // Validazione token
  if (!token) {
    msg.textContent = "Token mancante o non valido.";
    msg.className = "err";
    return;
  }

  // Protezione doppio click
  if (btnConfirmReset.disabled) return;
  btnConfirmReset.disabled = true;

  try {
    console.log("[RESET-PASS-CONFIRM] Invio conferma reset…");

    const res = await fetch("/api/utenti/reset-password-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nuova_password })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-PASS-CONFIRM] Risposta:", data);

    if (data.success) {
      msg.textContent = "Password aggiornata! Verrai reindirizzato al login…";
      msg.className = "ok";

      // =====================================================
      // ⭐ PATCH 2026.10 — Reset sessione dopo cambio password
      // =====================================================
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("ruolo");
      localStorage.setItem("sessionState", "0");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

      return;
    }

    msg.textContent = data.error || "Errore durante la conferma del reset.";
    msg.className = "err";

  } catch (err) {
    console.error("[RESET-PASS-CONFIRM] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnConfirmReset.disabled = false;
  }
});
