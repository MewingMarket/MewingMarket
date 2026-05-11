/* =========================================================
   RIMBORSO — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [RIMBORSO] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [RIMBORSO] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [RIMBORSO] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [RIMBORSO] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [RIMBORSO] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [RIMBORSO] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [RIMBORSO] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [RIMBORSO] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [RIMBORSO] critical-ready già presente → avvio modulo");

  avviaRimborso();
}

/* =========================================================
   CODICE ORIGINALE INCAPSULATO
========================================================= */
async function avviaRimborso() {
  console.log("🔥 rimborso.js READY");

  const form = document.getElementById("rimborsoForm");
  const emailInput = document.getElementById("email");
  const ordineSelect = document.getElementById("ordineSelect");
  const motivoInput = document.getElementById("motivo");

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Devi effettuare il login per richiedere un rimborso.");
    window.location.href = "/login";
    return;
  }

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiRimborso(path, options = {}) {
    console.log("🌐 [RIMBORSO] API:", path);

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    };

    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      console.error("❌ [RIMBORSO] Errore rete:", err);
      return null;
    }

    if (res.status === 401 || res.status === 403) {
      console.warn("🔒 [RIMBORSO] Token scaduto → redirect login");
      localStorage.removeItem("token");
      window.location.href = "/login";
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [RIMBORSO] Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [RIMBORSO] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     1) CARICA EMAIL UTENTE + ORDINI COMPLETATI
  ========================================================== */
  console.log("📥 [RIMBORSO] Carico ordini utente…");

  const ordiniData = await apiRimborso("/api/ordini/getOrdiniUtente", {
    method: "GET"
  });

  console.log("📦 [RIMBORSO] Risposta ordini:", ordiniData);

  if (!ordiniData || !ordiniData.ordini) {
    alert("Errore nel caricamento degli ordini.");
    return;
  }

  const userData = await apiRimborso("/api/utenti/me", { method: "GET" });

  if (userData?.utente?.email) {
    emailInput.value = userData.utente.email;
    emailInput.disabled = true;
  }

  const ordini = ordiniData.ordini.filter(o => o.stato === "completato");

  ordineSelect.innerHTML = "";

  if (ordini.length === 0) {
    ordineSelect.innerHTML = `<option value="">Nessun ordine completato</option>`;
  } else {
    ordineSelect.innerHTML = `<option value="">Seleziona un ordine</option>`;
    ordini.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = `Ordine #${o.id} — €${(o.totale_cent / 100).toFixed(2)}`;
      ordineSelect.appendChild(opt);
    });
  }

  /* =========================================================
     Preselezione ordine da URL
  ========================================================== */
  const params = new URLSearchParams(window.location.search);
  const preselectId = params.get("id");

  if (preselectId && ordini.some(o => String(o.id) === String(preselectId))) {
    console.log("🎯 [RIMBORSO] Preseleziono ordine:", preselectId);
    ordineSelect.value = preselectId;
  }

  /* =========================================================
     2) INVIO RICHIESTA RIMBORSO
  ========================================================== */
  form.addEventListener("submit", async e => {
    console.log("📨 [RIMBORSO] Invio richiesta rimborso…");

    e.preventDefault();

    const ordine_id = ordineSelect.value.trim();
    const motivo = motivoInput.value.trim();

    if (!ordine_id || !motivo) {
      alert("Compila tutti i campi.");
      return;
    }

    const data = await apiRimborso("/api/rimborso/creaRichiesta", {
      method: "POST",
      body: JSON.stringify({ ordine_id, motivo })
    });

    console.log("📦 [RIMBORSO] Risposta invio:", data);

    if (!data) {
      alert("Errore invio richiesta.");
      return;
    }

    if (data.message && data.message.includes("risolvibile")) {
      alert(
        "Il problema sembra risolvibile.\n" +
        "Ti abbiamo inviato una email con le istruzioni dettagliate."
      );
      form.reset();
      return;
    }

    alert("Richiesta inviata. Riceverai una risposta entro poche ore.");
    form.reset();
  });
}
