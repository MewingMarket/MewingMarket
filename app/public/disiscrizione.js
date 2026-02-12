document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ disiscrizione.js caricato");

  const form = document.getElementById("unsubscribeForm");
  const emailInput = document.getElementById("email");

  if (!form || !emailInput) {
    console.error("❌ Form o input email non trovati");
    return;
  }

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
     TRACKING SICURO
  ========================================================== */
  function safeTrack(event, data = {}) {
    try {
      if (window.trackEvent) {
        window.trackEvent(event, data);
      }
    } catch (err) {
      console.warn("Tracking error:", err);
    }
  }

  // Tracking page view
  safeTrack("newsletter_unsubscribe_page_view");

  /* =========================================================
     SUBMIT (blindato)
  ========================================================== */
  let sending = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (sending) return; // evita doppio invio
    sending = true;

    const email = clean(emailInput.value.trim());
    console.log("📭 Tentativo disiscrizione:", email);

    if (!isValidEmail(email)) {
      alert("Inserisci un'email valida.");
      sending = false;
      return;
    }

    safeTrack("newsletter_unsubscribe_attempt", { email });

    try {
      const res = await fetch("/newsletter/unsubscribe", {
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

      console.log("📬 Risposta server:", data);

      if (data.status === "ok") {
        safeTrack("newsletter_unsubscribe_success", { email });
        alert("Disiscrizione completata.");
      } else {
        safeTrack("newsletter_unsubscribe_error", {
          email,
          reason: data.message || "generic"
        });
        alert("Errore durante la disiscrizione.");
      }

    } catch (err) {
      console.error("❌ Errore fetch:", err);

      safeTrack("newsletter_unsubscribe_error", {
        email,
        error: err.message
      });

      alert("Errore di connessione.");
    }

    sending = false;
  });
});
