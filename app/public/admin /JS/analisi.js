// =========================================================
// ANALISI PERFORMANCE – ADMIN (versione blindata)
// =========================================================

// Sanitizzazione base
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// Fetch blindato admin
async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore fetch admin: " + url);
  return res.json();
}

// Render cella tabella
function td(value) {
  return `<td>${clean(String(value))}</td>`;
}

// =========================================================
// CARICA ANALISI
// =========================================================
async function caricaAnalisi() {
  try {
    const data = await adminGet("/api/admin/analisi/dati");

    // -------------------------
    // METRICHE PRINCIPALI
    // -------------------------
    document.getElementById("conv-rate").textContent =
      clean(data.stats.conversione) + "%";

    document.getElementById("traffico-totale").textContent =
      clean(data.stats.traffico);

    document.getElementById("ctr-medio").textContent =
      clean(data.stats.ctr) + "%";

    // -------------------------
    // ANALISI PRODOTTI
    // -------------------------
    const tbodyProd = document.querySelector("#tabella-analisi-prodotti tbody");
    tbodyProd.innerHTML = "";

    (data.prodotti || []).forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        td(p.nome) +
        td(p.visite) +
        td(p.carrelli) +
        td(p.vendite) +
        td(p.conversione + "%");
      tbodyProd.appendChild(tr);
    });

    // -------------------------
    // ANALISI TRAFFICO
    // -------------------------
    const tbodyTraffico = document.querySelector("#tabella-traffico tbody");
    tbodyTraffico.innerHTML = "";

    (data.traffico || []).forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        td(t.origine) +
        td(t.visite) +
        td(t.ctr + "%") +
        td(t.conversione + "%");
      tbodyTraffico.appendChild(tr);
    });

    // -------------------------
    // ANALISI UTM
    // -------------------------
    const tbodyUTM = document.querySelector("#tabella-utm tbody");
    tbodyUTM.innerHTML = "";

    (data.utm || []).forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        td(u.campagna) +
        td(u.visite) +
        td(u.vendite) +
        td(u.conversione + "%");
      tbodyUTM.appendChild(tr);
    });

  } catch (err) {
    console.error("Errore caricamento analisi:", err);
  }
}

// =========================================================
// INIT
// =========================================================
document.addEventListener("DOMContentLoaded", caricaAnalisi);
