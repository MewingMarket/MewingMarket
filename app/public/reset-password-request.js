/* =========================================================
   RESET PASSWORD REQUEST — UNIVERSAL JSON PATCH 2027.970
   Versione CF (ZERO-INPUT)
========================================================= */

console.log("[RESET-PASSWORD-REQ] Versione CF caricata");

document.addEventListener("critical-ready", () => {
  const btnResetPassword = document.getElementById("btnResetPassword");
  const msgResetPassword = document.getElementById("msgResetPassword");

  /* =========================================================
     WRAPPER UNIVERSALE (universal-json)
  ========================================================== */
  async function apiResetPasswordRequest(payload) {
    let res;
    try {
      res = await fetch("/api/utenti/resetPasswordRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("❌ Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ Risposta NON JSON da /api/utenti/resetPasswordRequest");
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     CLICK RESET PASSWORD REQUEST
  ========================================================== */
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

    console.log("[RESET-PASSWORD-REQ] Invio richiesta con CF:", codice_fiscale);

    const data = await apiResetPasswordRequest({ codice_fiscale });

    if (!data) {
      msg.textContent = "Errore durante la richiesta di reset password.";
      msg.className = "err";
      btnResetPassword.disabled = false;
      return;
    }

    /* =========================================================
       SUCCESSO — ZERO-INPUT
    ========================================================== */
    localStorage.setItem("cf_reset", codice_fiscale);
    window.location.href = "reset-password-confirm.html";
  });
});
