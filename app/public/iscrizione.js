document.addEventListener("DOMContentLoaded", () => {
  // Aspetta che header/footer siano caricati
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

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();

      try {
        const res = await fetch("/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
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
    });
  }, 200); // 🔥 attesa minima per caricamento header/footer
});
