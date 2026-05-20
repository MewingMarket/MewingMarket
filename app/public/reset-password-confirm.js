/* =========================================================
   RESET PASSWORD CONFIRM — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [RESET-PASS-CONFIRM 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [RESET-PASS-CONFIRM 2058] pageInit() avviata");
  avviaResetPasswordConfirm();
};

/* =========================================================
   LOGICA ORIGINALE (identica)
========================================================= */
function avviaResetPasswordConfirm() {
  console.log("🔥 reset-password-confirm.js READY (ZERO-INPUT)");

  const btnConfirmReset = document.getElementById("btnConfirmReset");
  const msg = document.getElementById("msgConfirmReset");

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiResetPassword(payload) {
    console.log("🌐 [RESET-PASS-CONFIRM] API /resetPasswordConfirm");

    let res;
    try {
      res = await fetch("/api/utenti/resetPasswordConfirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("❌ [RESET-PASS-CONFIRM] Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [RESET-PASS-CONFIRM] Risposta NON JSON");
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [RESET-PASS-CONFIRM] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     CLICK CONFERMA RESET PASSWORD
  ========================================================== */
  btnConfirmReset?.addEventListener("click", async () => {
    console.log("📨 [RESET-PASS-CONFIRM] Click conferma reset password");

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

    if (btnConfirmReset.disabled) {
      console.warn("⛔ [RESET-PASS-CONFIRM] Click ignorato: pulsante disabilitato");
      return;
    }

    btnConfirmReset.disabled = true;

    console.log("🚀 [RESET-PASS-CONFIRM] Invio conferma ZERO-INPUT…", {
      nuova_password,
      codice_fiscale
    });

    const data = await apiResetPassword({ nuova_password, codice_fiscale });

    console.log("📦 [RESET-PASS-CONFIRM] Risposta API:", data);

    if (!data) {
      msg.textContent = "Errore durante la conferma del reset password.";
      msg.className = "err";
      btnConfirmReset.disabled = false;
      return;
    }

    /* =========================================================
       SUCCESSO — SALVATAGGIO SESSIONE
    ========================================================== */
    console.log("🟢 [RESET-PASS-CONFIRM] Reset password riuscito");

    localStorage.removeItem("cf_reset");

    if (data.token && data.email) {
      console.log("🔐 [RESET-PASS-CONFIRM] Salvataggio token/email");
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
    }

    localStorage.setItem("sessionState", "1");

    console.log("➡️ [RESET-PASS-CONFIRM] Redirect a login.html");
    window.location.href = "login.html";
  });
}
