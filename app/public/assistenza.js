/* =========================================================
   ASSISTENZA — Frontend
   Versione 2026.995
   - Invio domanda
   - Nessuna logica AI lato client
   - Messaggi premium
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("assistenzaForm");
  const msgBox = document.getElementById("msgAssistenza");

  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const domanda = document.getElementById("domanda").value.trim();

    if (!email || !domanda) {
      mostraMessaggio("Compila tutti i campi.", "errore");
      return;
    }

    mostraMessaggio("Invio in corso…", "info");

    try {
      const res = await fetch("/api/assistenza/invia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, domanda })
      });

      const data = await res.json();

      if (!data.success) {
        mostraMessaggio(data.error || "Errore durante l'invio.", "errore");
        return;
      }

      mostraMessaggio("Richiesta inviata. Riceverai una risposta via email entro 24–48 ore.", "successo");
      form.reset();

    } catch (err) {
      console.error("Errore assistenza:", err);
      mostraMessaggio("Errore di connessione. Riprova più tardi.", "errore");
    }
  });

  /* =========================================================
     FUNZIONE MESSAGGI PREMIUM
  ========================================================= */
  function mostraMessaggio(testo, tipo) {
    if (!msgBox) return;

    msgBox.textContent = testo;

    msgBox.className = ""; // reset classi
    msgBox.classList.add("status");

    if (tipo === "errore") msgBox.classList.add("errore");
    if (tipo === "successo") msgBox.classList.add("successo");
    if (tipo === "info") msgBox.classList.add("info");
  }
});
