document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("subscribeForm");

  if (!form) {
    console.error("❌ Form newsletter non trovato");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;

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
});
