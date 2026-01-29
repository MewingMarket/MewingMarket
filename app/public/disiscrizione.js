document.addEventListener("DOMContentLoaded", () => {
  // Aspetta che header/footer siano caricati
  setTimeout(() => {
    const form = document.getElementById("unsubscribeForm");
    const emailInput = document.getElementById("email");

    if (!form) {
      console.error("❌ unsubscribeForm non trovato nella pagina");
      return;
    }

    if (!emailInput) {
      console.error("❌ Input email non trovato nella pagina");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();

      try {
        const res = await fetch("/newsletter/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (data.status === "ok") {
          alert("Disiscrizione completata.");
        } else {
          alert("Errore durante la disiscrizione.");
        }

      } catch (err) {
        console.error("❌ Errore durante la disiscrizione:", err);
        alert("Errore di connessione.");
      }
    });
  }, 200); // 🔥 attesa minima per caricamento header/footer
});
