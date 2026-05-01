/* =========================================================
   ASSISTENZA — UNIVERSAL JSON PATCH 2027.970
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

    const data = await apiAssistenza("/api/assistenza/inviaAssistenza", {
      method: "POST",
      body: JSON.stringify({ email, domanda })
    });

    if (!data) {
      mostraMessaggio("Errore durante l'invio.", "errore");
      return;
    }

    const testoRisposta = data.risposta
      ? `Risposta: ${data.risposta}`
      : "Richiesta inviata. Riceverai una risposta via email entro 24–48 ore.";

    mostraMessaggio(testoRisposta, "successo");
    form.reset();
  });

  /* =========================================================
     WRAPPER UNIVERSALE (universal-json)
  ========================================================== */
  async function apiAssistenza(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      console.error("❌ Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     MESSAGGI UI
  ========================================================== */
  function mostraMessaggio(testo, tipo) {
    if (!msgBox) return;
    msgBox.textContent = testo;
    msgBox.className = "status";
    if (tipo === "errore") msgBox.classList.add("errore");
    if (tipo === "successo") msgBox.classList.add("successo");
    if (tipo === "info") msgBox.classList.add("info");
  }
});
