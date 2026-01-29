document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    console.log("✅ disiscrizione.js caricato");

    const form = document.getElementById("unsubscribeForm");
    const emailInput = document.getElementById("email");

    if (!form || !emailInput) {
      console.error("❌ Form o input email non trovati");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      console.log("📭 Tentativo disiscrizione:", email);

      try {
        const res = await fetch("/newsletter/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
        console.log("📬 Risposta server:", data);

        if (data.status === "ok") {
          alert("Disiscrizione completata.");
        } else {
          alert("Errore durante la disiscrizione.");
        }

      } catch (err) {
        console.error("❌ Errore fetch:", err);
        alert("Errore di connessione.");
      }
    });
  }, 200);
});
