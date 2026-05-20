/* =========================================================
   RESET EMAIL CONFIRM — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [RESET-EMAIL-CONFIRM 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [RESET-EMAIL-CONFIRM 2058] pageInit() avviata");
  avviaResetEmailConfirm();
};

/* =========================================================
   LOGICA ORIGINALE (identica)
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
