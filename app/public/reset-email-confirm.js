/* =========================================================
   RESET EMAIL CONFIRM — UNIVERSAL JSON PATCH 2027.970
   Versione ZERO-INPUT
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [RESET-EMAIL-CONFIRM] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [RESET-EMAIL-CONFIRM] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [RESET-EMAIL-CONFIRM] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [RESET-EMAIL-CONFIRM] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [RESET-EMAIL-CONFIRM] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [RESET-EMAIL-CONFIRM] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [RESET-EMAIL-CONFIRM] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [RESET-EMAIL-CONFIRM] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [RESET-EMAIL-CONFIRM] critical-ready già presente → avvio modulo");

  avviaResetEmailConfirm();
}

/* =========================================================
   CODICE ORIGINALE INCAPSULATO
========================================================= */
function avviaResetEmailConfirm() {
  console.log("🔥 reset-email-confirm.js READY (ZERO-INPUT)");

  const btnConfirmEmail = document.getElementById("btnConfirmEmail");
  const msg = document.getElementById("msgConfirmEmail");

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiResetEmail(payload) {
    console.log("🌐 [RESET-EMAIL-CONFIRM] API /resetEmailConfirm");

    let res;
    try {
      res = await fetch("/api/utenti/resetEmailConfirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("❌ [RESET-EMAIL-CONFIRM] Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [RESET-EMAIL-CONFIRM] Risposta NON JSON");
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [RESET-EMAIL-CONFIRM] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     CLICK CONFERMA EMAIL
  ========================================================== */
  btnConfirmEmail?.addEventListener("click", async () => {
    console.log("📨 [RESET-EMAIL-CONFIRM] Click conferma email");

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

    console.log("🚀 [RESET-EMAIL-CONFIRM] Invio conferma ZERO-INPUT…", {
      nuova_email,
      codice_fiscale
    });

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
    console.log("🟢 [RESET-EMAIL-CONFIRM] Conferma riuscita:", data);

    localStorage.removeItem("cf_reset");

    if (data.token && data.email) {
      console.log("🔐 [RESET-EMAIL-CONFIRM] Salvataggio token/email");
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
    }

    localStorage.setItem("sessionState", "1");

    console.log("➡️ [RESET-EMAIL-CONFIRM] Redirect a login.html");
    window.location.href = "login.html";
  });
}
