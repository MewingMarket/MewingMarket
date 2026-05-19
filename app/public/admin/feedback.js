/* =========================================================
   ADMIN FEEDBACK — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Universale Admin
========================================================= */

console.log("📌 [ADMIN-FEEDBACK 2058] File caricato");

/* =========================================================
   SANITIZZAZIONE
========================================================= */
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

const fDate = (d) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return (
      date.toLocaleDateString("it-IT") +
      " " +
      date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    );
  } catch (e) {
    return d;
  }
};

/* =========================================================
   WRAPPER UNIVERSALE ADMIN (token + universal-json)
========================================================= */
async function adminApi(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const fullPath = path.startsWith("/api") ? path : `/api${path}`;

  const res = await fetch(fullPath, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [ADMIN-FEEDBACK] Token scaduto → redirect login");
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", fullPath);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   PAGE INIT — chiamata da Loader Universale Admin 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [ADMIN-FEEDBACK 2058] pageInit() avviata");

  caricaFeedback();
};

/* =========================================================
   RENDER KPI
========================================================= */
function renderKPI(kpi) {
  console.log("📊 [ADMIN-FEEDBACK] Render KPI");

  const box = document.querySelector("#kpi-feedback");
  if (!box || !kpi) {
    console.warn("⚠️ [ADMIN-FEEDBACK] KPI box non trovato o KPI null");
    return;
  }

  box.innerHTML = `
    <div class="kpi-header-grid">
      <div class="kpi-card main">
        <span class="label">Totale Recensioni</span>
        <span class="value">${kpi.totale || 0}</span>
      </div>
      <div class="kpi-card main">
        <span class="label">Media Valutazioni</span>
        <span class="value">⭐ ${kpi.media_stelle || "0.00"}</span>
      </div>
    </div>

    <div class="kpi-details-grid">
      <div class="kpi-section">
        <h4>Distribuzione Valutazioni</h4>
        <div class="stars-distribution">
          ${[5, 4, 3, 2, 1]
            .map((s) => {
              const perc = kpi.percentuali?.[s] || 0;
              return `
              <div class="star-row">
                <span class="star-label">${s} ⭐</span>
                <div class="progress-bar"><div class="fill" style="width: ${perc}%"></div></div>
                <span class="star-perc">${perc}%</span>
              </div>`;
            })
            .join("")}
        </div>
      </div>
      
      <div class="kpi-section">
        <h4>Top & Flop Prodotti</h4>
        <div class="rank-flex">
          <div class="rank-col">
            <small>TOP 5</small>
            <ul>${(kpi.prodotti_top || [])
              .map((p) => `<li>${clean(p.titolo)} (⭐${p.media})</li>`)
              .join("")}</ul>
          </div>
          <div class="rank-col">
            <small>FLOP 5</small>
            <ul>${(kpi.prodotti_flop || [])
              .map((p) => `<li>${clean(p.titolo)} (⭐${p.media})</li>`)
              .join("")}</ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   CARICA FEEDBACK
========================================================= */
async function caricaFeedback() {
  console.log("📥 [ADMIN-FEEDBACK] Carico feedback…");

  const tbody = document.querySelector("#tabella-feedback tbody");
  if (!tbody) {
    console.warn("❌ [ADMIN-FEEDBACK] tbody non trovato");
    return;
  }

  tbody.innerHTML = "<tr><td colspan='5'>Interrogazione database SQL...</td></tr>";

  const data = await adminApi("/api/admin/feedback/getListaFeedback", {
    method: "GET"
  });

  if (!data) {
    console.warn("❌ [ADMIN-FEEDBACK] Errore caricamento feedback");
    tbody.innerHTML =
      "<tr><td colspan='5'>Errore tecnico nel recupero dei feedback.</td></tr>";
    return;
  }

  console.log("🟢 [ADMIN-FEEDBACK] Feedback caricati:", data);

  if (data.kpi) renderKPI(data.kpi);

  const feedbackLista = data.feedback || [];
  tbody.innerHTML = "";

  if (feedbackLista.length === 0) {
    tbody.innerHTML =
      "<tr><td colspan='5'>Nessuna recensione presente nel database.</td></tr>";
    return;
  }

  feedbackLista.forEach((f) => {
    const tr = document.createElement("tr");

    const prodotto = f.prodotto_titolo || "Prodotto rimosso";
    const utente = f.utente_email || "Anonimo";

    tr.innerHTML = `
      <td><b>${clean(prodotto)}</b></td>
      <td><span class="stars-visual">${"⭐".repeat(
        f.rating
      )}</span> <small>(${f.rating}/5)</small></td>
      <td class="cell-comment"><em>"${clean(f.commento)}"</em></td>
      <td><small>${clean(utente)}</small></td>
      <td><small>${fDate(f.data)}</small></td>
    `;
    tbody.appendChild(tr);
  });
}
