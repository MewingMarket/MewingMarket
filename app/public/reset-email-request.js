/* =========================================================
   RESET EMAIL REQUEST — UNIVERSAL JSON PATCH 2027.970
   Versione CF (ZERO-INPUT)
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [RESET-EMAIL-REQ] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [RESET-EMAIL-REQ] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [RESET-EMAIL-REQ] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [RESET-EMAIL-REQ] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [RESET-EMAIL-REQ] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [RESET-EMAIL-REQ] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [RESET-EMAIL-REQ] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [RESET-EMAIL-REQ] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [RESET-EMAIL-REQ] critical-ready già presente → avvio modulo");

  avviaResetEmailRequest();
}

/* =========================================================
   CODICE ORIGINALE INCAPSULATO
========================================================= */
function avviaResetEmailRequest() {
  console.log("🔥 reset-email-request.js READY (ZERO-INPUT)");

  const btnResetEmail = document.getElementById("btnResetEmail");
  const msgResetEmail = document.getElementById("msgResetEmail");

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiResetEmailRequest(payload) {
    console.log("🌐 [RESET-EMAIL-REQ] API /resetEmailRequest");

    let res;
    try {
      res = await fetch("/api/utenti/resetEmailRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("❌ [RESET-EMAIL-REQ] Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [RESET-EMAIL-REQ] Risposta NON JSON");
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [RESET-EMAIL-REQ] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     CLICK RESET EMAIL REQUEST
  ========================================================== */
  btnResetEmail?.addEventListener("click", async () => {
    console.log("📨 [RESET-EMAIL-REQ] Click reset email");

    const msg = msgResetEmail;
    if (!msg) return;

    const codice_fiscale = document.getElementById("cf")?.value.trim().toUpperCase();

    if (!codice_fiscale || codice_fiscale.length !== 16) {
      msg.textContent = "Inserisci un codice fiscale valido.";
      msg.className = "err";
      return;
    }

    if (btnResetEmail.disabled) {
      console.warn("⛔ [RESET-EMAIL-REQ] Click ignorato: pulsante disabilitato");
      return;
    }

    btnResetEmail.disabled = true;

    msg.textContent = "Invio richiesta in corso...";
    msg.className = "msg";

    console.log("🚀 [RESET-EMAIL-REQ] Invio richiesta con CF:", codice_fiscale);

    const data = await apiResetEmailRequest({ codice_fiscale });

    console.log("📦 [RESET-EMAIL-REQ] Risposta API:", data);

    if (!data) {
      msg.textContent = "Errore durante la richiesta di reset email.";
      msg.className = "err";
      btnResetEmail.disabled = false;
      return;
    }

    /* =========================================================
       SUCCESSO — ZERO-INPUT
    ========================================================== */
    console.log("🟢 [RESET-EMAIL-REQ] Richiesta accettata, salvo cf_reset");

    localStorage.setItem("cf_reset", codice_fiscale);

    console.log("➡️ [RESET-EMAIL-REQ] Redirect a reset-email-confirm.html");
    window.location.href = "reset-email-confirm.html";
  });
}
