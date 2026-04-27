/* =========================================================
   ASSISTENZA — Frontend (Versione Patchata 2027)
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
      // PATCH 2027 — nuovo endpoint Java‑mode
      const res = await fetch("/api/assistenza/inviaAssistenza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, domanda })
      });

      const data = await res.json();

      if (!data.success) {
        mostraMessaggio(data.error || "Errore durante l'invio.", "errore");
        return;
      }

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
    msgBox.className = "status";
    if (tipo === "errore") msgBox.classList.add("errore");
    if (tipo === "successo") msgBox.classList.add("successo");
    if (tipo === "info") msgBox.classList.add("info");
  }
});
