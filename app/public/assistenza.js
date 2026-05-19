/* =========================================================
   ASSISTENZA — UNIVERSAL JSON PATCH 2027.4
   Compatibile con backend 2027.3
========================================================= */

console.log("📌 [ASSISTENZA] File caricato nel DOM");

// =========================================================
// AUTORUN — parte SEMPRE
// =========================================================
(function autorun() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }
  initPage();
})();

// =========================================================
// INIT PAGE
// =========================================================
function initPage() {
  if (!window.__criticalReady) {
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }
  avviaAssistenza();
}

// =========================================================
// LOGICA ASSISTENZA
// =========================================================
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

    const res = await apiAssistenza("/api/assistenza/inviaAssistenza", {
      email,
      domanda
    });

    if (!res || !res.success) {
      mostraMessaggio("Errore durante l'invio.", "errore");
      return;
    }

    // Backend 2027.3 restituisce: { success: true, ticket }
    const ticket = res.ticket || "—";

    mostraMessaggio(
      `Richiesta inviata! Ticket n° ${ticket}. Riceverai una risposta via email entro 24–48 ore.`,
      "successo"
    );

    form.reset();
  });

  // ============================================================
  // WRAPPER UNIVERSALE
  // ============================================================
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

  // ============================================================
  // UI
  // ============================================================
  function mostraMessaggio(testo, tipo) {
    if (!msgBox) return;
    msgBox.textContent = testo;
    msgBox.className = "status " + tipo;
  }
}
