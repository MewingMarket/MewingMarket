// FILE: public/admin/validazione-prodotti.js

/* =========================================================
   VALIDAZIONE PRODOTTI — Versione 2026.300
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [VALIDAZIONE-PRODOTTI] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE, anche se il DOM è riscritto
// =========================================================
(function autorun() {
  console.log("🚀 [VALIDAZIONE-PRODOTTI] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [VALIDAZIONE-PRODOTTI] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [VALIDAZIONE-PRODOTTI] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [VALIDAZIONE-PRODOTTI] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [VALIDAZIONE-PRODOTTI] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE DELLA PAGINA
// =========================================================
function initPage() {
  console.log("🏁 [VALIDAZIONE-PRODOTTI] initPage() eseguita");

  // Se critical-ready non è ancora arrivato, aspettiamo
  if (!window.__criticalReady) {
    console.log("⏳ [VALIDAZIONE-PRODOTTI] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [VALIDAZIONE-PRODOTTI] critical-ready già presente → avvio pagina");

  avviaValidazioneProdotti();
}

// =========================================================
// CODICE ORIGINALE INCAPSULATO
// =========================================================
function avviaValidazioneProdotti() {
  console.log("🔥 validazione-prodotti.js READY");

  /* =========================================================
     API ADMIN
  ========================================================== */
  async function adminApi(path, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : ""
    };

    const res = await fetch(path, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
      console.warn("🔒 [VALIDAZIONE-PRODOTTI] Token non valido → redirect login");
      localStorage.removeItem("token");
      location.href = "/admin/login";
      return null;
    }

    let json;
    try { json = await res.json(); } catch { return null; }

    return json.success ? json.data : null;
  }

  /* ---------------------------------------------------------
     ELEMENTI DOM
  --------------------------------------------------------- */
  const input = document.getElementById("input-ricerca");
  const btnCerca = document.getElementById("btn-cerca");
  const statusRicerca = document.getElementById("status-ricerca");

  const boxRisultati = document.getElementById("risultati-validazione");

  const valMotivazione = document.getElementById("val-motivazione");
  const valNote = document.getElementById("val-note");

  const btnGenera = document.getElementById("btn-genera-prodotto");
  const statusGenerazione = document.getElementById("status-generazione");

  /* KPI */
  const kpiTrend = document.getElementById("kpi-trend");
  const kpiColore = document.getElementById("kpi-colore");
  const kpiCategoria = document.getElementById("kpi-categoria");
  const kpiId = document.getElementById("kpi-id");

  let validazioneCorrente = null;

  /* =========================================================
     CERCA PRODOTTO (AI)
  ========================================================== */
  btnCerca.onclick = async () => {
    console.log("🔍 [VALIDAZIONE-PRODOTTI] Ricerca prodotto AI…");

    const query = input.value.trim();
    if (!query) return;

    statusRicerca.textContent = "Ricerca AI in corso...";
    boxRisultati.style.display = "none";

    const data = await adminApi("/api/ai/searchproduct", {
      method: "POST",
      body: JSON.stringify({ query })
    });

    if (!data) {
      console.warn("❌ [VALIDAZIONE-PRODOTTI] Errore ricerca AI");
      statusRicerca.textContent = "Errore durante la ricerca.";
      return;
    }

    validazioneCorrente = data;

    /* KPI */
    kpiTrend.textContent = data.trend_score;
    kpiColore.textContent = data.colore;
    kpiCategoria.textContent = data.categoria || "—";
    kpiId.textContent = data.id;

    /* Testi */
    valMotivazione.textContent = data.motivazione || "—";
    valNote.textContent = data.note_ricerca || "—";

    boxRisultati.style.display = "block";
    statusRicerca.textContent = "";

    console.log("🟢 [VALIDAZIONE-PRODOTTI] Risultati AI mostrati");
  };

  /* =========================================================
     GENERA PRODOTTO (AI)
  ========================================================== */
  btnGenera.onclick = async () => {
    console.log("⚙️ [VALIDAZIONE-PRODOTTI] Generazione prodotto AI…");

    if (!validazioneCorrente) {
      console.warn("⚠️ [VALIDAZIONE-PRODOTTI] Nessuna validazione corrente");
      return;
    }

    statusGenerazione.textContent = "Generazione prodotto AI...";

    const config = {
      type: "ebook",
      pages: 120,
      level: "intermedio",
      language: "IT",
      target: "principianti",
      price: 49
    };

    const data = await adminApi("/api/ai/generateproduct", {
      method: "POST",
      body: JSON.stringify({
        validazione_id: validazioneCorrente.id,
        config
      })
    });

    statusGenerazione.textContent = data
      ? "Prodotto generato! Vai in 'Prodotti' → 'Da Generare'"
      : "Errore generazione prodotto.";

    console.log("📦 [VALIDAZIONE-PRODOTTI] Risposta generateproduct:", data);
  };
}
