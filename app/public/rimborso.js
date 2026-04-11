document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("rimborsoForm");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const ordine = document.getElementById("ordine").value.trim();
    const motivo = document.getElementById("motivo").value.trim();

    if (!email || !ordine || !motivo) {
      alert("Compila tutti i campi.");
      return;
    }

    try {
      const res = await fetch("/api/rimborso/crea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ordine, motivo })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Errore invio richiesta.");
        return;
      }

      alert("Richiesta inviata. Ti risponderemo entro 24–48 ore.");
      form.reset();

    } catch (err) {
      console.error("Errore rimborso:", err);
      alert("Errore di connessione.");
    }
  });
});
