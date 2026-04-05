/* =========================================================
   File: app/public/admin/feedback.js
   Admin — Lista completa feedback clienti
   Versione definitiva 2026 (PATCH + DEBUG SUPREMO + KPI)
========================================================= */

// Sanitizzazione sicura
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// =========================================================
// FETCH NORMALE (come admin-prodotti.js)
// =========================================================
async function adminGet(url) {
  console.log("[ADMIN][FETCH] Chiamata a:", url);

  const res = await fetch(url);

  if (!res.ok) {
    console.error("[ADMIN][FETCH] Errore HTTP:", res.status, res.statusText);
    throw new Error("Errore fetch admin: " + url);
  }

  const json = await res.json();
  console.log("[ADMIN][FETCH] Risposta JSON:", json);

  return json;
}

// =========================================================
// RENDER KPI (nuova funzione)
// =========================================================
function renderKPI(kpi) {
  console.log("🟣 [ADMIN] Render KPI:", kpi);

  const box = document.querySelector("#kpi-feedback");
  if (!box) {
    console.error("❌ [ADMIN] Manca #kpi-feedback nel DOM");
    return;
  }

  box.innerHTML = `
    <h3>📊 KPI Feedback</h3>

    <div class="kpi-row">
      <div class="kpi-box">
        <div class="kpi-label">Totale recensioni</div>
        <div class="kpi-value">${clean(kpi.totale)}</div>
      </div>

      <div class="kpi-box">
        <div class="kpi-label">Media stelle</div>
        <div class="kpi-value">${clean(kpi.media_stelle)}</div>
      </div>
    </div>

    <h4>Distribuzione stelle</h4>
    <ul>
      <li>⭐ 5 stelle: ${clean(kpi.percentuali[5])}%</li>
      <li>⭐ 4 stelle: ${clean(kpi.percentuali[4])}%</li>
      <li>⭐ 3 stelle: ${clean(kpi.percentuali[3])}%</li>
      <li>⭐ 2 stelle: ${clean(kpi.percentuali[2])}%</li>
      <li>⭐ 1 stella: ${clean(kpi.percentuali[1])}%</li>
    </ul>

    <h4>Top 5 prodotti</h4>
    <ul>
      ${kpi.prodotti_top
        .map(
          (p) =>
            `<li>${clean(p.titolo)} — ⭐ ${clean(p.media)} (${clean(
              p.count
            )} recensioni)</li>`
        )
        .join("")}
    </ul>

    <h4>Flop 5 prodotti</h4>
    <ul>
      ${kpi.prodotti_flop
        .map(
          (p) =>
            `<li>${clean(p.titolo)} — ⭐ ${clean(p.media)} (${clean(
              p.count
            )} recensioni)</li>`
        )
        .join("")}
    </ul>
  `;
}

// =========================================================
// CARICA FEEDBACK (compatibile con admin-feedback.cjs)
// =========================================================
async function caricaFeedback() {
  console.log("🔵 [ADMIN] Avvio caricaFeedback()");

  try {
    console.log("🔵 [ADMIN] Richiedo /api/admin/feedback/lista…");

    const data = await adminGet("/api/admin/feedback/lista");

    console.log("🟣 [ADMIN] Dati ricevuti da backend:", data);

    // ============================
    // PATCH KPI
    // ============================
    if (data.kpi) {
      renderKPI(data.kpi);
    } else {
      console.warn("⚠ [ADMIN] Nessuna KPI ricevuta dal backend");
    }

    // ============================
    // TABELLA FEEDBACK
    // ============================
    const tbody = document.querySelector("#tabella-feedback tbody");
    tbody.innerHTML = "";

    if (!data || !Array.isArray(data.feedback)) {
      console.error("❌ [ADMIN] data.feedback NON è un array:", data);
      return;
    }

    console.log("🟢 [ADMIN] Numero feedback:", data.feedback.length);

    data.feedback.forEach((f, idx) => {
      console.log(`   [ADMIN][ROW ${idx}]`, f);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${clean(f.prodotto_titolo)}</td>
        <td>${clean(f.rating)}</td>
        <td>${clean(f.commento)}</td>
        <td>${clean(f.utente_email)}</td>
        <td>${clean(f.data)}</td>
      `;
      tbody.appendChild(tr);
    });

    console.log("🟩 [ADMIN] Feedback renderizzati nella tabella");

  } catch (err) {
    console.error("❌ [ADMIN] Errore caricamento feedback:", err);
  }
}

// =========================================================
// INIT — Avvio solo dopo caricamento header/footer/head
// =========================================================
document.addEventListener("admin-header-loaded", () => {
  console.log("🔵 [ADMIN] Evento admin-header-loaded ricevuto");
  caricaFeedback();
});
