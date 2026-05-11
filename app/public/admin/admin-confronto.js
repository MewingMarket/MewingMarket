/* =========================================================
   ADMIN CONFRONTO — Versione 2026.300 (PATCH 2050 AUTORUN)
   - Confronto validazioni / prodotti_da_creare / pubblicati
   - universal-json
   - autorun + debug esteso
========================================================= */

console.log("📌 [ADMIN-CONFRONTO] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE, anche se il DOM è riscritto
// =========================================================
(function autorun() {
  console.log("🚀 [ADMIN-CONFRONTO] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [ADMIN-CONFRONTO] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [ADMIN-CONFRONTO] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [ADMIN-CONFRONTO] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [ADMIN-CONFRONTO] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE DELLA PAGINA
// =========================================================
function initPage() {
  console.log("🏁 [ADMIN-CONFRONTO] initPage() eseguita");

  // Se critical-ready non è ancora arrivato, aspettiamo
  if (!window.__criticalReady) {
    console.log("⏳ [ADMIN-CONFRONTO] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [ADMIN-CONFRONTO] critical-ready già presente → avvio pagina");

  // =========================================================
  // CODICE ORIGINALE (INVARIATO)
  // =========================================================

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

  console.log("🔥 admin-confronto.js READY");

  const filtroTesto = document.getElementById("filtro-testo");
  const filtroTipo = document.getElementById("filtro-tipo");
  const btnFiltra = document.getElementById("btn-filtra");

  const box = document.getElementById("confronto-container");

  const detBox = document.getElementById("dettaglio-box");
  const detTitolo = document.getElementById("dettaglio-titolo");
  const detDescrizione = document.getElementById("det-descrizione");

  /* KPI */
  const kpiTipo = document.getElementById("kpi-det-tipo");
  const kpiCategoria = document.getElementById("kpi-det-categoria");
  const kpiPrezzo = document.getElementById("kpi-det-prezzo");
  const kpiTrend = document.getElementById("kpi-det-trend");

  let validazioni = [];
  let daCreare = [];
  let pubblicati = [];

  /* =========================================================
     CARICA TUTTI I DATI
  ========================================================== */
  async function caricaDati() {
    console.log("📥 [ADMIN-CONFRONTO] Carico dati…");

    box.innerHTML = "<p>Caricamento...</p>";

    validazioni = await adminApi("/api/generico/get?table=validazioni", { method: "GET" }) || [];
    daCreare = await adminApi("/api/admin/getprodottidacreare", { method: "GET" }) || [];
    pubblicati = await adminApi("/api/prodotti/getProdottiAdmin", { method: "GET" }) || [];

    console.log("📊 [ADMIN-CONFRONTO] Dati caricati:", {
      validazioni: validazioni.length,
      daCreare: daCreare.length,
      pubblicati: pubblicati.length
    });

    mostraRisultati();
  }

  /* =========================================================
     MOSTRA RISULTATI
  ========================================================== */
  function mostraRisultati() {
    console.log("📄 [ADMIN-CONFRONTO] Mostro risultati");

    const testo = filtroTesto.value.trim().toLowerCase();
    const tipo = filtroTipo.value;

    let items = [];

    if (tipo === "tutti" || tipo === "validazioni") {
      items.push(...validazioni.map(v => ({
        tipo: "validazione",
        id: v.id,
        titolo: v.titolo,
        categoria: v.categoria,
        trend: v.trend_score,
        descrizione: v.motivazione,
        raw: v
      })));
    }

    if (tipo === "tutti" || tipo === "da-creare") {
      items.push(...daCreare.map(p => ({
        tipo: "da-creare",
        id: p.id,
        titolo: p.titolo,
        categoria: p.categoria,
        prezzo: p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : "—",
        descrizione: p.descrizione_tecnica,
        raw: p
      })));
    }

    if (tipo === "tutti" || tipo === "pubblicati") {
      items.push(...pubblicati.map(p => ({
        tipo: "pubblicato",
        id: p.id,
        titolo: p.titolo,
        categoria: p.categoria,
        prezzo: (p.prezzo_cent / 100).toFixed(2),
        descrizione: p.descrizione_lunga,
        raw: p
      })));
    }

    if (testo) {
      items = items.filter(i =>
        i.titolo?.toLowerCase().includes(testo) ||
        i.categoria?.toLowerCase().includes(testo) ||
        String(i.id).includes(testo)
      );
    }

    if (items.length === 0) {
      box.innerHTML = "<p>Nessun risultato.</p>";
      return;
    }

    box.innerHTML = items.map(i => `
      <div class="admin-card">
        <div class="admin-card-info">
          <h3>${i.titolo}</h3>
          <p>${i.tipo.toUpperCase()} | ID: ${i.id}</p>
          <button class="btn-dettaglio" data-tipo="${i.tipo}" data-id="${i.id}">
            Dettaglio
          </button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".btn-dettaglio")
      .forEach(btn => btn.onclick = () => apriDettaglio(btn.dataset.tipo, btn.dataset.id));
  }

  /* =========================================================
     DETTAGLIO
  ========================================================== */
  function apriDettaglio(tipo, id) {
    console.log("🔍 [ADMIN-CONFRONTO] Apri dettaglio:", tipo, id);

    let item;

    if (tipo === "validazione") item = validazioni.find(v => v.id == id);
    if (tipo === "da-creare") item = daCreare.find(v => v.id == id);
    if (tipo === "pubblicato") item = pubblicati.find(v => v.id == id);

    if (!item) {
      console.warn("❌ [ADMIN-CONFRONTO] Item non trovato");
      return;
    }

    detBox.style.display = "block";

    detTitolo.textContent = item.titolo;
    detDescrizione.textContent =
      item.descrizione_tecnica ||
      item.motivazione ||
      item.descrizione_lunga ||
      item.descrizione ||
      "—";

    /* KPI */
    kpiTipo.textContent = tipo;
    kpiCategoria.textContent = item.categoria || "—";
    kpiPrezzo.textContent =
      item.prezzo_cent ? (item.prezzo_cent / 100).toFixed(2) : item.prezzo || "—";
    kpiTrend.textContent = item.trend_score || item.trend || "—";

    window.scrollTo({ top: detBox.offsetTop - 50, behavior: "smooth" });
  }

  /* =========================================================
     EVENTI
  ========================================================== */
  btnFiltra.onclick = mostraRisultati;

  /* =========================================================
     AVVIO
  ========================================================== */
  caricaDati();
}
