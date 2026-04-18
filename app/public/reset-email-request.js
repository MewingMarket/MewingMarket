/* =========================================================
   RESET EMAIL REQUEST — Versione CF (PATCH 2027.400)
   - critical-ready
   - fetchUniversale (fallback chain)
   - Nessuna regressione
========================================================= */

console.log("[RESET-EMAIL-REQ] Versione CF caricata");

document.addEventListener("critical-ready", () => {
  const btnResetEmail = document.getElementById("btnResetEmail");
  const msgResetEmail = document.getElementById("msgResetEmail");

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

    try {
      console.log("[RESET-EMAIL-REQ] Invio richiesta con CF:", codice_fiscale);

      const res = await window.fetchUniversale(
        "/utenti/reset-email-request",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codice_fiscale })
        },
        { retries: 2, backoffMs: 300 }
      );

      const data = await res.json().catch(() => ({}));
      console.log("[RESET-EMAIL-REQ] Risposta:", data);

      if (data.success) {

        // 🔥 ZERO-INPUT: salvo il CF per la pagina di conferma
        localStorage.setItem("cf_reset", codice_fiscale);

        window.location.href = "reset-email-confirm.html";
        return;
      }

      msg.textContent = data.error || "Errore durante la richiesta di reset email.";
      msg.className = "err";

    } catch (err) {
      console.error("[RESET-EMAIL-REQ] Errore:", err);
      msg.textContent = "Errore di connessione.";
      msg.className = "err";
    } finally {
      btnResetEmail.disabled = false;
    }
  });
});
