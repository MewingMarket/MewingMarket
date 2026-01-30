document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("subscribeForm");
  const emailInput = document.getElementById("email");

  if (!form || !emailInput) {
    console.error("❌ Form o input email non trovati");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    // Tracking tentativo
    if (window.trackEvent) {
      trackEvent("newsletter_subscribe_attempt", { email });
    }

    try {
      const res = await fetch("/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.status === "ok") {
        // Tracking successo
        if (window.trackEvent) {
          trackEvent("newsletter_subscribe_success", { email });
        }

        alert("Iscrizione completata!");
      } else {
        // Tracking errore
        if (window.trackEvent) {
          trackEvent("newsletter_subscribe_error", {
            email,
            reason: data.message || "generic"
          });
        }

        alert("Errore durante l'iscrizione.");
      }

    } catch (err) {
      console.error("❌ Errore fetch:", err);

      // Tracking errore connessione
      if (window.trackEvent) {
        trackEvent("newsletter_subscribe_error", {
          email,
          error: err.message
        });
      }

      alert("Errore di connessione.");
    }
  });
});
