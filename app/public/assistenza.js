/* =========================================================
   ASSISTENZA — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [ASSISTENZA] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE, anche se il DOM è riscritto
// =========================================================
(function autorun() {
  console.log("🚀 [ASSISTENZA] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [ASSISTENZA] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [ASSISTENZA] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [ASSISTENZA] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [ASSISTENZA] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE DELLA PAGINA
// =========================================================
function initPage() {
  console.log("🏁 [ASSISTENZA] initPage() eseguita");

  // Se critical-ready non è ancora arrivato, aspettiamo
  if (!window.__criticalReady) {
    console.log("⏳ [ASSISTENZA] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [ASSISTENZA] critical-ready già presente → avvio pagina");

  avviaAssistenza();
}

// =========================================================
// CODICE ORIGINALE INCAPSULATO
// =========================================================
function avviaAssistenza() {
  console.log("🔥 assistenza.js READY");

  const form = document.getElementById("assistenzaForm");
  const msgBox = document.getElementById("msgAssistenza");

  if (!form) {
    console.warn("❌ [ASSISTENZA] assistenzaForm NON trovato");
    return;
  }

  form.addEventListener("submit", async e => {
    console.log("📨 [ASSISTENZA] Submit form…");
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const domanda = document.getElementById("domanda").value.trim();

    if (!email || !domanda) {
      console.warn("⚠️ [ASSISTENZA] Campi mancanti");
      mostraMessaggio("Compila tutti i campi.", "errore");
      return;
    }

    mostraMessaggio("Invio in corso…", "info");

    const data = await apiAssistenza("/api/assistenza/inviaAssistenza", {
      method: "POST",
      body: JSON.stringify({ email, domanda })
    });

    if (!data) {
      console.warn("❌ [ASSISTENZA] Errore API assistenza");
      mostraMessaggio("Errore durante l'invio.", "errore");
      return;
    }

    const testoRisposta = data.risposta
      ? `Risposta: ${data.risposta}`
      : "Richiesta inviata. Riceverai una risposta via email entro 24–48 ore.";

    console.log("🟢 [ASSISTENZA] Risposta ricevuta:", data);

    mostraMessaggio(testoRisposta, "successo");
    form.reset();
  });

  /* =========================================================
     WRAPPER UNIVERSALE (universal-json)
  ========================================================== */
  async function apiAssistenza(path, options = {}) {
    console.log("🌐 [ASSISTENZA] Chiamata API:", path);

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      console.error("❌ [ASSISTENZA] Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [ASSISTENZA] Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [ASSISTENZA] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     MESSAGGI UI
  ========================================================== */
  function mostraMessaggio(testo, tipo) {
    console.log(`💬 [ASSISTENZA] Messaggio UI (${tipo}):`, testo);

    if (!msgBox) {
      console.warn("⚠️ [ASSISTENZA] msgAssistenza NON trovato");
      return;
    }

    msgBox.textContent = testo;
    msgBox.className = "status";
    if (tipo === "errore") msgBox.classList.add("errore");
    if (tipo === "successo") msgBox.classList.add("successo");
    if (tipo === "info") msgBox.classList.add("info");
  }
}
