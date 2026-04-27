/* =========================================================
   ADMIN FEEDBACK — Versione SQL 2027.900 (PATCH TOKEN)
   Sincronizzata con admin-feedback.cjs + auth-user.cjs
========================================================= */

const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// Formattazione data italiana
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
   FETCH ADMIN — Token + fallback login
========================================================= */
async function adminGet(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const fullPath = path.startsWith("/api") ? path : `/api${path}`;

  const res = await fetch(fullPath, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    return null;
  }

  return res;
}

/* =========================================================
   RENDER KPI (Barre percentuali + Top/Flop)
========================================================= */
function renderKPI(kpi) {
  const box = document.querySelector("#kpi-feedback");
  if (!box || !kpi) return;

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
   CARICA FEEDBACK (con token)
========================================================= */
async function caricaFeedback() {
  const tbody = document.querySelector("#tabella-feedback tbody");
  if (!tbody) return;

  tbody.innerHTML = "<tr><td colspan='5'>Interrogazione database SQL...</td></tr>";

  try {
    // ⭐ PATCH — endpoint Java‑mode
    const res = await adminGet("/api/admin/feedback/getListaFeedback");
    if (!res) return;

    const data = await res.json();
    console.log("🟢 [ADMIN] Feedback caricati:", data);

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
  } catch (err) {
    console.error("❌ [ADMIN] Errore caricamento feedback:", err);
    tbody.innerHTML =
      "<tr><td colspan='5'>Errore tecnico nel recupero dei feedback.</td></tr>";
  }
}

document.addEventListener("critical-ready", () => {
  caricaFeedback();
});
