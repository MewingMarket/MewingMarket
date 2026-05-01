/* =========================================================
   RESET EMAIL REQUEST — UNIVERSAL JSON PATCH 2027.970
   Versione CF (ZERO-INPUT)
========================================================= */

console.log("[RESET-EMAIL-REQ] Versione CF caricata");

document.addEventListener("critical-ready", () => {
  const btnResetEmail = document.getElementById("btnResetEmail");
  const msgResetEmail = document.getElementById("msgResetEmail");

  /* =========================================================
     WRAPPER UNIVERSALE (universal-json)
  ========================================================== */
  async function apiResetEmailRequest(payload) {
    let res;
    try {
      res = await fetch("/api/utenti/resetEmailRequest", {
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
      console.error("❌ Risposta NON JSON da /api/utenti/resetEmailRequest");
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     CLICK RESET EMAIL REQUEST
  ========================================================== */
  btnResetEmail?.addEventListener("click", async () => {
    const msg = msgResetEmail;
    if (!msg) return;

    const codice_fiscale = document.getElementById("cf")?.value.trim().toUpperCase();

    if (!codice_fiscale || codice_fiscale.length !== 16) {
      msg.textContent = "Inserisci un codice fiscale valido.";
      msg.className = "err";
      return;
    }

    if (btnResetEmail.disabled) return;
    btnResetEmail.disabled = true;

    msg.textContent = "Invio richiesta in corso...";
    msg.className = "msg";

    console.log("[RESET-EMAIL-REQ] Invio richiesta con CF:", codice_fiscale);

    const data = await apiResetEmailRequest({ codice_fiscale });

    if (!data) {
      msg.textContent = "Errore durante la richiesta di reset email.";
      msg.className = "err";
      btnResetEmail.disabled = false;
      return;
    }

    /* =========================================================
       SUCCESSO — ZERO-INPUT
    ========================================================== */
    localStorage.setItem("cf_reset", codice_fiscale);
    window.location.href = "reset-email-confirm.html";
  });
});
