/* =========================================================
   DISISCRIZIONE NEWSLETTER — PATCH 2027.300
   - Usa fetchCritico globale
   - Alias API universale
   - Nessuna regressione
========================================================= */

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

    if (sending) return;
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
      // ⭐ PATCH 2027.300 — usa fetchCritico globale + alias API
      const res = await window.fetchCritico(
        "/newsletter/unsubscribe",
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
        data = { success: false, error: "Invalid JSON" };
      }

      console.log("📬 Risposta server:", data);

      if (data.success === true) {
        safeTrack("newsletter_unsubscribe_success", { email });
        alert("Disiscrizione completata.");
      } else {
        safeTrack("newsletter_unsubscribe_error", {
          email,
          reason: data.error || "generic"
        });
        alert(data.error || "Errore durante la disiscrizione.");
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
