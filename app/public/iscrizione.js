/* =========================================================
   NEWSLETTER SUBSCRIBE — PATCH 2027.300
   - Usa fetchCritico globale
   - Alias API universale
   - Nessuna regressione
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     SANITIZZAZIONE
  ========================================================== */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  /* =========================================================
     VALIDAZIONE EMAIL (blindata)
  ========================================================== */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* =========================================================
     INIZIALIZZAZIONE SICURA
  ========================================================== */
  setTimeout(() => {
    const form = document.getElementById("subscribeForm");
    const emailInput = document.getElementById("email");

    if (!form) {
      console.error("❌ subscribeForm non trovato nella pagina");
      return;
    }

    if (!emailInput) {
      console.error("❌ Input email non trovato nella pagina");
      return;
    }

    let sending = false;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (sending) return;
      sending = true;

      const email = clean(emailInput.value.trim());

      if (!isValidEmail(email)) {
        alert("Inserisci un'email valida.");
        sending = false;
        return;
      }

      try {
        // ⭐ PATCH 2027.300 — usa fetchCritico globale + alias API
        const res = await window.fetchCritico(
          "/newsletter/subscribe",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          },
          { retries: 2, backoffMs: 300 }
        );

        let data = {};
        try {
          data = await res.json();
        } catch {
          data = { success: false, message: "Invalid JSON" };
        }

        console.log("Risposta server:", data);

        if (data.success === true) {
          alert("Iscrizione completata!");
        } else {
          alert("Errore durante l'iscrizione.");
        }

      } catch (err) {
        console.error("❌ Errore fetch:", err);
        alert("Errore di connessione.");
      }

      sending = false;
    });
  }, 200);
});
