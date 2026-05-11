/* =========================================================
   ADMIN UTENTI — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [ADMIN-UTENTI] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE, anche se il DOM è riscritto
// =========================================================
(function autorun() {
  console.log("🚀 [ADMIN-UTENTI] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [ADMIN-UTENTI] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [ADMIN-UTENTI] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [ADMIN-UTENTI] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [ADMIN-UTENTI] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE DELLA PAGINA
// =========================================================
function initPage() {
  console.log("🏁 [ADMIN-UTENTI] initPage() eseguita");

  // Se critical-ready non è ancora arrivato, aspettiamo
  if (!window.__criticalReady) {
    console.log("⏳ [ADMIN-UTENTI] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [ADMIN-UTENTI] critical-ready già presente → avvio pagina");

  /* =========================================================
     EVENTO ORIGINALE
  ========================================================== */
  console.log("[ADMIN] Init admin-utenti.js (UNIVERSAL JSON)");
  syncBrevoAuto();
  caricaUtenti();
}

/* =========================================================
   Helper: Formattazione Data
========================================================= */
function fDate(d) {
  if (!d || d === "" || d === "Sì") return d || "—";
  try {
    const data = new Date(d);
    return (
      data.toLocaleDateString("it-IT") +
      " " +
      data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    );
  } catch (e) {
    return d;
  }
}

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

  // Token scaduto
  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [ADMIN-UTENTI] Token scaduto → redirect login");
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    return null;
  }

  // universal-json
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
   SYNC BREVO AUTOMATICO
========================================================= */
async function syncBrevoAuto() {
  console.log("🔄 [ADMIN-UTENTI] Sync Brevo automatico…");

  const ok = await adminApi("/api/admin/utenti/syncBrevo", { method: "GET" });
  if (ok) console.log("🟢 [BREVO] Sync OK");
  else console.warn("🟡 [BREVO] Sync fallito o non necessario");
}

/* =========================================================
   CARICA UTENTI + KPI
========================================================= */
async function caricaUtenti() {
  console.log("📥 [ADMIN-UTENTI] Carico lista utenti…");

  const tbody = document.querySelector("#tabella-utenti tbody");
  if (!tbody) {
    console.warn("❌ [ADMIN-UTENTI] tbody non trovato");
    return;
  }

  tbody.innerHTML =
    "<tr><td colspan='15'>Interrogazione SQL in corso...</td></tr>";

  const data = await adminApi("/api/admin/utenti/getListaUtenti", {
    method: "GET"
  });

  if (!data) {
    console.warn("❌ [ADMIN-UTENTI] Errore caricamento utenti");
    tbody.innerHTML =
      "<tr><td colspan='15'>Errore caricamento. Verifica Token o Backend.</td></tr>";
    return;
  }

  const lista = data.utenti || [];

  console.log("📊 [ADMIN-UTENTI] Utenti caricati:", lista.length);

  const kpi = calcolaKPI(lista);
  stampaKPI(kpi);

  tbody.innerHTML = "";

  lista.forEach((u) => {
    const isBannato =
      u.bloccato &&
      (!u.sbloccato || new Date(u.bloccato) > new Date(u.sbloccato));

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.email}</td>
      <td><small>${u.codice_fiscale || "-"}</small></td>
      <td>${fDate(u.registrato)}</td>
      <td>${fDate(u.login)}</td>
      <td>${fDate(u.logout)}</td>
      <td>${fDate(u.eliminato)}</td>
      <td>${fDate(u.bloccato)}</td>
      <td>${fDate(u.sbloccato)}</td>
      <td style="color: ${isBannato ? "#ff4d4d" : "#2ecc71"}">
        <b>${isBannato ? "SÌ" : "no"}</b>
      </td>
      <td>${u.iscritto ? "✅" : "—"}</td>
      <td>${u.disiscritto ? "❌" : "—"}</td>
      <td>${u.registrato_brevo === "presente" ? "✅" : "—"}</td>
      <td>${u.cliente_brevo === "presente" ? "💰" : "—"}</td>
      <td>${u.cliente_db === "sì" ? "📦" : "—"}</td>
      <td>
        ${
          u.email !== "amministratore"
            ? `
          <div class="admin-actions-flex">
            <button class="btn-blocca" data-email="${u.email}">Blocca</button>
            <button class="btn-sblocca" data-email="${u.email}">Sblocca</button>
            <button class="btn-elimina" data-email="${u.email}">Elimina</button>
          </div>
        `
            : "<em>SuperAdmin</em>"
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================================================
   LISTENERS (Blocca / Sblocca / Elimina)
========================================================= */
document.addEventListener("click", async (e) => {
  const email = e.target.dataset.email;
  if (!email) return;

  const btn = e.target;
  let azione = "";

  if (btn.classList.contains("btn-blocca")) azione = "bloccaUtente";
  if (btn.classList.contains("btn-sblocca")) azione = "sbloccaUtente";
  if (btn.classList.contains("btn-elimina")) {
    if (!confirm(`Eliminare definitivamente ${email}?`)) return;
    azione = "eliminaUtente";
  }

  if (!azione) return;

  console.log(`⚡ [ADMIN-UTENTI] Azione: ${azione} → ${email}`);

  const ok = await adminApi(`/api/admin/utenti/${azione}`, {
    method: "POST",
    body: JSON.stringify({ email })
  });

  if (ok) {
    console.log("🟢 [ADMIN-UTENTI] Operazione OK → ricarico utenti");
    caricaUtenti();
  } else {
    console.warn("❌ [ADMIN-UTENTI] Errore operazione");
    alert("Errore durante l'operazione.");
  }
});
