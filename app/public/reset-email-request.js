/* =========================================================
   RESET EMAIL REQUEST — Versione 2027.503 SAFE MODE
   - ZERO-INPUT
   - Nessun token
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
========================================================= */

console.log("📌 [RESET-EMAIL-REQ 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [RESET-EMAIL-REQ 2058] pageInit() avviata");
  avviaResetEmailRequest();
};

/* =========================================================
   LOGICA PRINCIPALE
========================================================= */
function avviaResetEmailRequest() {
  console.log("🔥 reset-email-request.js READY (ZERO-INPUT)");

  const btnResetEmail = document.getElementById("btnResetEmail");
  const msgResetEmail = document.getElementById("msgResetEmail");

  /* =========================================================
     WRAPPER UNIVERSALE (SAFE MODE)
  ========================================================== */
  async function apiResetEmailRequest(payload) {
    console.log("🌐 [RESET-EMAIL-REQ] API /resetEmailRequest");

    let res;
    try {
      res = await fetch("/api/utenti/resetEmailRequest", {
        method: "POST",
        credentials: "include",
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

    return json; // NON json.data
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

    const res = await apiResetEmailRequest({ codice_fiscale });

    console.log("📦 [RESET-EMAIL-REQ] Risposta API:", res);

    if (!res) {
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
