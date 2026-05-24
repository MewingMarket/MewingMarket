/* =========================================================
   RESET EMAIL CONFIRM — Versione 2027.503 SAFE MODE
   - ZERO-INPUT
   - Nessun token nel localStorage
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
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
   LOGICA PRINCIPALE
========================================================= */
function avviaResetEmailConfirm() {
  console.log("🔥 reset-email-confirm.js READY (ZERO-INPUT)");

  const btnConfirmEmail = document.getElementById("btnConfirmEmail");
  const msg = document.getElementById("msgConfirmEmail");

  /* =========================================================
     WRAPPER UNIVERSALE (SAFE MODE)
  ========================================================== */
  async function apiResetEmail(payload) {
    console.log("🌐 [RESET-EMAIL-CONFIRM] API /resetEmailConfirm");

    let res;
    try {
      res = await fetch("/api/utenti/resetEmailConfirm", {
        method: "POST",
        credentials: "include",
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

    return json; // NON json.data
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

    const res = await apiResetEmail({ nuova_email, codice_fiscale });

    if (!res) {
      msg.textContent = "Errore durante la conferma del cambio email.";
      msg.className = "err";
      btnConfirmEmail.disabled = false;
      return;
    }

    /* =========================================================
       SUCCESSO — ZERO-INPUT SAFE MODE
       Nessun token/email salvato nel localStorage
       La sessione è nei cookie
    ========================================================== */
    console.log("🟢 [RESET-EMAIL-CONFIRM] Conferma riuscita:", res);

    localStorage.removeItem("cf_reset");
    localStorage.setItem("sessionState", "1");

    console.log("➡️ [RESET-EMAIL-CONFIRM] Redirect a login.html");
    window.location.href = "login.html";
  });
}
