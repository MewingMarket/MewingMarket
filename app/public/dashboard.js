/* =========================================================
   DASHBOARD.JS — UNIVERSAL JSON PATCH 2027.970
   Gestione Sidebar Utente
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [SIDEBAR] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE
// =========================================================
(function autorun() {
  console.log("🚀 [SIDEBAR] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [SIDEBAR] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [SIDEBAR] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [SIDEBAR] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [SIDEBAR] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE
// =========================================================
function initPage() {
  console.log("🏁 [SIDEBAR] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [SIDEBAR] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [SIDEBAR] critical-ready già presente → avvio sidebar");

  avviaSidebar();
}

// =========================================================
// CODICE ORIGINALE INCAPSULATO
// =========================================================
async function avviaSidebar() {
  console.log("🔥 sidebar.js READY");

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("⚠️ [SIDEBAR] Nessun token → sidebar non caricata");
    return;
  }

  console.log("🌐 [SIDEBAR] Chiamo /api/utenti/me …");

  const data = await apiSidebar("/api/utenti/me", { method: "GET" });

  console.log("📦 [SIDEBAR] Risposta API:", data);

  if (!data || !data.utente) {
    console.warn("❌ [SIDEBAR] Nessun utente valido");
    return;
  }

  const u = data.utente;

  const emailEl = document.getElementById("sidebarEmail");
  const userEl = document.getElementById("sidebarUsername");
  const cfEl = document.getElementById("sidebarCF");

  if (emailEl) {
    emailEl.textContent = u.email;
    console.log("🟢 [SIDEBAR] Email impostata:", u.email);
  }

  if (userEl) {
    const username = u.username || u.email.split("@")[0];
    userEl.textContent = username;
    console.log("🟢 [SIDEBAR] Username impostato:", username);
  }

  if (cfEl) {
    cfEl.textContent = u.codice_fiscale || "";
    console.log("🟢 [SIDEBAR] Codice fiscale impostato:", u.codice_fiscale);
  }
}

/* =========================================================
   WRAPPER UNIVERSALE (token + universal-json)
========================================================= */
async function apiSidebar(path, options = {}) {
  console.log("🌐 [SIDEBAR] API:", path);

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ [SIDEBAR] Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [SIDEBAR] Token scaduto → redirect login");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [SIDEBAR] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [SIDEBAR] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}
