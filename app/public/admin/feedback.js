/* =========================================================
   Admin — Lista completa feedback clienti
   Versione 2026.301 (PATCH CHIRURGICA)
   - Mantiene logica
   - Aggiunge token admin
   - Anti-HTML
   - Anti-502
========================================================= */

const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

async function adminGet(url) {
  console.log("[ADMIN][FETCH] Chiamata a:", url);

  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    }
  });

  const ct = res.headers.get("content-type") || "";

  if (ct.includes("text/html")) {
    const html = await res.text();
    console.error("❌ HTML ricevuto invece di JSON:", html.slice(0, 300));
    throw new Error("Risposta HTML inattesa");
  }

  if (!res.ok) {
    console.error("[ADMIN][FETCH] Errore HTTP:", res.status, res.statusText);
    throw new Error("Errore fetch admin: " + url);
  }

  return res.json();
}

function renderKPI(kpi) {
  const box = document.querySelector("#kpi-feedback");
  if (!box) return;

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
        .map(p => `<li>${clean(p.titolo)} — ⭐ ${clean(p.media)} (${clean(p.count)} recensioni)</li>`)
        .join("")}
    </ul>

    <h4>Flop 5 prodotti</h4>
    <ul>
      ${kpi.prodotti_flop
        .map(p => `<li>${clean(p.titolo)} — ⭐ ${clean(p.media)} (${clean(p.count)} recensioni)</li>`)
        .join("")}
    </ul>
  `;
}

async function caricaFeedback() {
  console.log("🔵 [ADMIN] Avvio caricaFeedback()");

  try {
    const data = await adminGet("/api/admin/feedback/lista");

    if (data.kpi) renderKPI(data.kpi);

    const tbody = document.querySelector("#tabella-feedback tbody");
    tbody.innerHTML = "";

    if (!Array.isArray(data.feedback)) return;

    data.feedback.forEach(f => {
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

  } catch (err) {
    console.error("❌ [ADMIN] Errore caricamento feedback:", err);
  }
}

document.addEventListener("admin-header-loaded", () => {
  caricaFeedback();
});
