/* =========================================================
   RESET PASSWORD REQUEST — UNIVERSAL JSON PATCH 2027.970
   Versione CF (ZERO-INPUT)
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [RESET-PASSWORD-REQ] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [RESET-PASSWORD-REQ] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [RESET-PASSWORD-REQ] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [RESET-PASSWORD-REQ] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [RESET-PASSWORD-REQ] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [RESET-PASSWORD-REQ] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [RESET-PASSWORD-REQ] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [RESET-PASSWORD-REQ] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [RESET-PASSWORD-REQ] critical-ready già presente → avvio modulo");

  avviaResetPasswordRequest();
}

/* =========================================================
   CODICE ORIGINALE INCAPSULATO
========================================================= */
function avviaResetPasswordRequest() {
  console.log("🔥 reset-password-request.js READY (ZERO-INPUT)");

  const btnResetPassword = document.getElementById("btnResetPassword");
  const msgResetPassword = document.getElementById("msgResetPassword");

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiResetPasswordRequest(payload) {
    console.log("🌐 [RESET-PASSWORD-REQ] API /resetPasswordRequest");

    let res;
    try {
      res = await fetch("/api/utenti/resetPasswordRequest", {
        method: "POST",
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

    return json.data;
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

    const data = await apiResetPasswordRequest({ codice_fiscale });

    console.log("📦 [RESET-PASSWORD-REQ] Risposta API:", data);

    if (!data) {
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
