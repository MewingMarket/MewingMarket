/* =========================================================
   RESET PASSWORD REQUEST — Versione 2027.503 SAFE MODE
   - ZERO-INPUT
   - Nessun token
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
========================================================= */

console.log("📌 [RESET-PASSWORD-REQ 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [RESET-PASSWORD-REQ 2058] pageInit() avviata");
  avviaResetPasswordRequest();
};

/* =========================================================
   LOGICA PRINCIPALE
========================================================= */
function avviaResetPasswordRequest() {
  console.log("🔥 reset-password-request.js READY (ZERO-INPUT)");

  const btnResetPassword = document.getElementById("btnResetPassword");
  const msgResetPassword = document.getElementById("msgResetPassword");

  /* =========================================================
     WRAPPER UNIVERSALE (SAFE MODE)
  ========================================================== */
  async function apiResetPasswordRequest(payload) {
    console.log("🌐 [RESET-PASSWORD-REQ] API /resetPasswordRequest");

    let res;
    try {
      res = await fetch("/api/utenti/resetPasswordRequest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("❌ [RESET-PASSWORD-REQ] Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [RESET-PASSWORD-REQ] Risposta NON JSON");
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [RESET-PASSWORD-REQ] Errore API:", json.error || json.raw);
      return null;
    }

    return json; // NON json.data
  }

  /* =========================================================
     CLICK RESET PASSWORD REQUEST
  ========================================================== */
  btnResetPassword?.addEventListener("click", async () => {
    console.log("📨 [RESET-PASSWORD-REQ] Click reset password");

    const msg = msgResetPassword;
    if (!msg) return;

    const codice_fiscale = document.getElementById("cf")?.value.trim().toUpperCase();

    if (!codice_fiscale || codice_fiscale.length !== 16) {
      msg.textContent = "Inserisci un codice fiscale valido.";
      msg.className = "err";
      return;
    }

    if (btnResetPassword.disabled) {
      console.warn("⛔ [RESET-PASSWORD-REQ] Click ignorato: pulsante disabilitato");
      return;
    }

    btnResetPassword.disabled = true;

    msg.textContent = "Invio richiesta in corso...";
    msg.className = "msg";

    console.log("🚀 [RESET-PASSWORD-REQ] Invio richiesta con CF:", codice_fiscale);

    const res = await apiResetPasswordRequest({ codice_fiscale });

    console.log("📦 [RESET-PASSWORD-REQ] Risposta API:", res);

    if (!res) {
      msg.textContent = "Errore durante la richiesta di reset password.";
      msg.className = "err";
      btnResetPassword.disabled = false;
      return;
    }

    /* =========================================================
       SUCCESSO — ZERO-INPUT
    ========================================================== */
    console.log("🟢 [RESET-PASSWORD-REQ] Richiesta accettata, salvo cf_reset");

    localStorage.setItem("cf_reset", codice_fiscale);

    console.log("➡️ [RESET-PASSWORD-REQ] Redirect a reset-password-confirm.html");
    window.location.href = "reset-password-confirm.html";
  });
}
