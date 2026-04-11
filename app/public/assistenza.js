/* =========================================================
   ASSISTENZA — Frontend
   Versione 2026.900
   - Invio domanda
   - Nessuna logica AI lato client
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("assistenzaForm");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const domanda = document.getElementById("domanda").value.trim();

    if (!email || !domanda) {
      alert("Compila tutti i campi.");
      return;
    }

    try {
      const res = await fetch("/api/assistenza/invia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, domanda })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Errore invio richiesta.");
        return;
      }

      alert("Richiesta inviata. Riceverai una risposta via email.");
      form.reset();

    } catch (err) {
      console.error("Errore assistenza:", err);
      alert("Errore di connessione.");
    }
  });
});
