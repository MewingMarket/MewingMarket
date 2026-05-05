// FILE: public/admin/validazione-prodotti.js


/* =========================================================
   VALIDAZIONE PRODOTTI — Versione 2026.300
   - AI searchproduct
   - AI generateproduct (con config)
   - KPI integrate
   - universal-json
========================================================= */

async function adminApi(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    location.href = "/admin/login";
    return null;
  }

  let json;
  try { json = await res.json(); } catch { return null; }

  return json.success ? json.data : null;
}

document.addEventListener("critical-ready", () => {
  console.log("🔥 validazione-prodotti.js READY");

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
    const query = input.value.trim();
    if (!query) return;

    statusRicerca.textContent = "Ricerca AI in corso...";
    boxRisultati.style.display = "none";

    const data = await adminApi("/api/ai/searchproduct", {
      method: "POST",
      body: JSON.stringify({ query })
    });

    if (!data) {
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
  };

  /* =========================================================
     GENERA PRODOTTO (AI)
     - genera descrizione tecnica
     - genera immagine
     - genera file di consegna
     - salva in prodotti_da_creare
  ========================================================== */
  btnGenera.onclick = async () => {
    if (!validazioneCorrente) return;

    statusGenerazione.textContent = "Generazione prodotto AI...";

    /* ---------------------------------------------------------
       CONFIGURAZIONE PRODOTTO
       (questa parte verrà poi collegata ai campi UI)
    --------------------------------------------------------- */
    const config = {
      type: "ebook",          // tipo prodotto
      pages: 120,             // numero pagine
      level: "intermedio",    // livello
      language: "IT",         // lingua
      target: "principianti", // target
      price: 49               // prezzo base
    };

    /* ---------------------------------------------------------
       CHIAMATA generateproduct
    --------------------------------------------------------- */
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
  };
});
