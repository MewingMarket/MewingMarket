document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ disiscrizione.js caricato");

  const form = document.getElementById("unsubscribeForm");
  const emailInput = document.getElementById("email");

  if (!form || !emailInput) {
    console.error("❌ Form o input email non trovati");
    return;
  }

  // Tracking page view
  if (window.trackEvent) {
    trackEvent("newsletter_unsubscribe_page_view");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    console.log("📭 Tentativo disiscrizione:", email);

    // Tracking tentativo
    if (window.trackEvent) {
      trackEvent("newsletter_unsubscribe_attempt", { email });
    }

    try {
      const res = await fetch("/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      console.log("📬 Risposta server:", data);

      if (data.status === "ok") {
        // Tracking successo
        if (window.trackEvent) {
          trackEvent("newsletter_unsubscribe_success", { email });
        }

        alert("Disiscrizione completata.");
      } else {
        // Tracking errore
        if (window.trackEvent) {
          trackEvent("newsletter_unsubscribe_error", {
            email,
            reason: data.message || "generic"
          });
        }

        alert("Errore durante la disiscrizione.");
      }

    } catch (err) {
      console.error("❌ Errore fetch:", err);

      // Tracking errore connessione
      if (window.trackEvent) {
        trackEvent("newsletter_unsubscribe_error", {
          email,
          error: err.message
        });
      }

      alert("Errore di connessione.");
    }
  });
});
