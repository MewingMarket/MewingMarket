/* =========================================================
   ASSISTENZA — Versione 2058.2 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [ASSISTENZA 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [ASSISTENZA 2058] pageInit() avviata");
  avviaAssistenza();
};

/* =========================================================
   LOGICA ASSISTENZA
========================================================= */
function avviaAssistenza() {
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

    // ⭐ PATCH: endpoint corretto
    const res = await apiAssistenza("/api/assistenza/invia", {
      email,
      domanda
    });

    if (!res || !res.success) {
      mostraMessaggio("Errore durante l'invio.", "errore");
      return;
    }

    const ticket = res.ticket || "—";

    mostraMessaggio(
      `Richiesta inviata! Ticket n° ${ticket}. Riceverai una risposta via email entro 24–48 ore.`,
      "successo"
    );

    form.reset();
  });

  /* ============================================================
     WRAPPER UNIVERSALE
  ============================================================ */
  async function apiAssistenza(path, payload = {}) {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);
      return json || { success: false };

    } catch (err) {
      console.error("❌ [ASSISTENZA] Errore rete:", err);
      return { success: false };
    }
  }

  /* ============================================================
     UI
  ============================================================ */
  function mostraMessaggio(testo, tipo) {
    if (!msgBox) return;
    msgBox.textContent = testo;
    msgBox.className = "status " + tipo;
  }
}
