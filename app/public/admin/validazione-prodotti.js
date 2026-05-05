/* =========================================================
   VALIDAZIONE PRODOTTI — Versione 2026.300
   - AI searchproduct
   - AI generateproduct
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
  try {
    json = await res.json();
  } catch {
    return null;
  }

  return json.success ? json.data : null;
}

document.addEventListener("critical-ready", () => {
  console.log("🔥 validazione-prodotti.js READY");

  const input = document.getElementById("input-ricerca");
  const btnCerca = document.getElementById("btn-cerca");
  const statusRicerca = document.getElementById("status-ricerca");

  const boxRisultati = document.getElementById("risultati-validazione");

  const valTitolo = document.getElementById("val-titolo");
  const valCategoria = document.getElementById("val-categoria");
  const valTrend = document.getElementById("val-trend");
  const valColore = document.getElementById("val-colore");
  const valMotivazione = document.getElementById("val-motivazione");
  const valNote = document.getElementById("val-note");

  const btnGenera = document.getElementById("btn-genera-prodotto");
  const statusGenerazione = document.getElementById("status-generazione");

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

    valTitolo.textContent = data.titolo;
    valCategoria.textContent = data.categoria || "—";
    valTrend.textContent = data.trend_score;
    valColore.textContent = data.colore;
    valMotivazione.textContent = data.motivazione || "—";
    valNote.textContent = data.note_ricerca || "—";

    boxRisultati.style.display = "block";
    statusRicerca.textContent = "";
  };

  /* =========================================================
     GENERA PRODOTTO (AI)
  ========================================================== */
  btnGenera.onclick = async () => {
    if (!validazioneCorrente) return;

    statusGenerazione.textContent = "Generazione prodotto AI...";

    const data = await adminApi("/api/ai/generateproduct", {
      method: "POST",
      body: JSON.stringify({ validazione_id: validazioneCorrente.id })
    });

    statusGenerazione.textContent = data
      ? "Prodotto generato! Vai in 'Prodotti' → 'Da Generare'"
      : "Errore generazione prodotto.";
  };
});
