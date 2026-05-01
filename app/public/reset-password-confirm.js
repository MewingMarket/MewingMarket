/* =========================================================
   RESET PASSWORD CONFIRM — UNIVERSAL JSON PATCH 2027.970
   Versione ZERO-INPUT
========================================================= */

console.log("[RESET-PASS-CONFIRM] Versione ZERO-INPUT caricata");

document.addEventListener("critical-ready", () => {
  const btnConfirmReset = document.getElementById("btnConfirmReset");
  const msg = document.getElementById("msgConfirmReset");

  /* =========================================================
     WRAPPER UNIVERSALE (universal-json)
  ========================================================== */
  async function apiResetPassword(payload) {
    let res;
    try {
      res = await fetch("/api/utenti/resetPasswordConfirm", {
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
      console.error("❌ Risposta NON JSON da /api/utenti/resetPasswordConfirm");
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     CLICK CONFERMA RESET PASSWORD
  ========================================================== */
  btnConfirmReset?.addEventListener("click", async () => {
    const nuova_password = document.getElementById("newPassword")?.value.trim();
    const conferma = document.getElementById("confirmPassword")?.value.trim();
    const codice_fiscale = localStorage.getItem("cf_reset");

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

    console.log("[RESET-PASS-CONFIRM] Invio conferma ZERO-INPUT…");

    const data = await apiResetPassword({ nuova_password, codice_fiscale });

    if (!data) {
      msg.textContent = "Errore durante la conferma del reset password.";
      msg.className = "err";
      btnConfirmReset.disabled = false;
      return;
    }

    /* =========================================================
       SUCCESSO — SALVATAGGIO SESSIONE
    ========================================================== */
    localStorage.removeItem("cf_reset");

    if (data.token && data.email) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
    }

    localStorage.setItem("sessionState", "1");
    window.location.href = "login.html";
  });
});
