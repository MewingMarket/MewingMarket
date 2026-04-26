/* =========================================================
   ASSISTENZA — Frontend (Versione Patchata)
========================================================= */

document.addEventListener("critical-ready", () => {
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
      const res = await window.fetchUniversale(
        "/api/assistenza/invia",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, domanda })
        },
        { retries: 2, backoffMs: 300 }
      );

      const data = await res.json();

      // Se il server risponde con successo: false
      if (!data.success) {
        mostraMessaggio(data.error || "Errore durante l'invio.", "errore");
        return;
      }

      // Se l'AI ha generato una risposta immediata, la mostriamo, altrimenti messaggio standard
      const testoRisposta = data.risposta 
        ? `Risposta: ${data.risposta}` 
        : "Richiesta inviata. Riceverai una risposta via email entro 24–48 ore.";

      mostraMessaggio(testoRisposta, "successo");
      form.reset();

    } catch (err) {
      console.error("Errore assistenza:", err);
      mostraMessaggio("Errore di connessione. Riprova più tardi.", "errore");
    }
  });

  function mostraMessaggio(testo, tipo) {
    if (!msgBox) return;
    msgBox.textContent = testo;
    msgBox.className = "status"; // Reset classi base
    if (tipo === "errore") msgBox.classList.add("errore");
    if (tipo === "successo") msgBox.classList.add("successo");
    if (tipo === "info") msgBox.classList.add("info");
  }
});
