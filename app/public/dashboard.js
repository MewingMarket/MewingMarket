/* =========================================================
   SIDEBAR UTENTE — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [SIDEBAR 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [SIDEBAR 2058] pageInit() avviata");
  avviaSidebar();
};

/* =========================================================
   LOGICA ORIGINALE (identica)
========================================================= */
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
