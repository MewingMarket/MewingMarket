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

      if (sending) return; // evita doppio invio
      sending = true;

      const email = clean(emailInput.value.trim());

      if (!isValidEmail(email)) {
        alert("Inserisci un'email valida.");
        sending = false;
        return;
      }

      try {
        const res = await fetch("/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        let data = {};
        try {
          data = await res.json();
        } catch {
          data = { status: "error", message: "Invalid JSON" };
        }

        console.log("Risposta server:", data);

        if (data.status === "ok") {
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
  }, 200); // attesa minima per caricamento header/footer
});
