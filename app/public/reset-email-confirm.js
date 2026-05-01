/* =========================================================
   RESET EMAIL CONFIRM — UNIVERSAL JSON PATCH 2027.970
   Versione ZERO-INPUT
========================================================= */

console.log("[RESET-EMAIL-CONFIRM] Versione ZERO-INPUT caricata");

document.addEventListener("critical-ready", () => {
  const btnConfirmEmail = document.getElementById("btnConfirmEmail");
  const msg = document.getElementById("msgConfirmEmail");

  /* =========================================================
     WRAPPER UNIVERSALE (universal-json)
  ========================================================== */
  async function apiResetEmail(payload) {
    let res;
    try {
      res = await fetch("/api/utenti/resetEmailConfirm", {
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
      console.error("❌ Risposta NON JSON da /api/utenti/resetEmailConfirm");
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     CLICK CONFERMA EMAIL
  ========================================================== */
  btnConfirmEmail?.addEventListener("click", async () => {
    const nuova_email = document.getElementById("newEmail")?.value.trim().toLowerCase();
    const codice_fiscale = localStorage.getItem("cf_reset");

    if (!msg) return;

    if (!nuova_email) {
      msg.textContent = "Inserisci la nuova email.";
      msg.className = "err";
      return;
    }

    if (!nuova_email.includes("@") || !nuova_email.includes(".")) {
      msg.textContent = "Inserisci un'email valida.";
      msg.className = "err";
      return;
    }

    if (!codice_fiscale || codice_fiscale.length !== 16) {
      msg.textContent = "Errore interno: codice fiscale mancante.";
      msg.className = "err";
      return;
    }

    if (btnConfirmEmail.disabled) return;
    btnConfirmEmail.disabled = true;

    console.log("[RESET-EMAIL-CONFIRM] Invio conferma ZERO-INPUT…");

    const data = await apiResetEmail({ nuova_email, codice_fiscale });

    if (!data) {
      msg.textContent = "Errore durante la conferma del cambio email.";
      msg.className = "err";
      btnConfirmEmail.disabled = false;
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
