/* =========================================================
   DASHBOARD ADMIN PROFILO — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Universale Admin
========================================================= */

console.log("📌 [DASHBOARD-ADMIN 2058] File caricato");

/* =========================================================
   SANITIZZAZIONE
========================================================= */
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

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

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [DASHBOARD-ADMIN] Token scaduto → redirect login");
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
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
  console.log("🏁 [DASHBOARD-ADMIN 2058] pageInit() avviata");

  popolaDatiAdmin();
  setupCambioEmail();
  setupCambioPassword();
};

/* =========================================================
   1) POPOLA DATI PROFILO ADMIN
========================================================= */
async function popolaDatiAdmin() {
  console.log("📥 [DASHBOARD-ADMIN] Carico dati admin…");

  const data = await adminApi("/api/admin/me", { method: "GET" });
  if (!data || !data.admin) {
    console.warn("❌ [DASHBOARD-ADMIN] Nessun admin trovato");
    return;
  }

  const a = data.admin;

  const emailEl = document.getElementById("adminEmailMain");
  const userEl = document.getElementById("adminUsernameMain");
  const cfEl = document.getElementById("adminCFMain");
  const roleEl = document.getElementById("adminRoleMain");

  if (emailEl) emailEl.textContent = a.email;
  if (userEl) userEl.textContent = a.email.split("@")[0];
  if (cfEl) cfEl.textContent = a.codice_fiscale;
  if (roleEl) roleEl.textContent = a.ruolo;

  console.log("🟢 [DASHBOARD-ADMIN] Dati admin popolati");
}

/* =========================================================
   2) CAMBIO EMAIL
========================================================= */
function setupCambioEmail() {
  const btn = document.getElementById("btnAdminCambiaEmail");
  if (!btn) {
    console.warn("⚠️ [DASHBOARD-ADMIN] Bottone cambio email non trovato");
    return;
  }

  btn.addEventListener("click", async () => {
    console.log("✉️ [DASHBOARD-ADMIN] Cambio email…");

    const nuova = clean(document.getElementById("newAdminEmail").value);
    const pass = clean(document.getElementById("passwordAdminEmail").value);
    const msg = document.getElementById("msgAdminEmail");

    const data = await adminApi("/api/admin/cambiaEmail", {
      method: "POST",
      body: JSON.stringify({ nuova, pass })
    });

    if (!data) {
      msg.textContent = "Errore aggiornamento email.";
      return;
    }

    msg.textContent = data.message || "Email aggiornata.";

    setTimeout(() => location.reload(), 1000);
  });
}

/* =========================================================
   3) CAMBIO PASSWORD
========================================================= */
function setupCambioPassword() {
  const btn = document.getElementById("btnAdminCambiaPassword");
  if (!btn) {
    console.warn("⚠️ [DASHBOARD-ADMIN] Bottone cambio password non trovato");
    return;
  }

  btn.addEventListener("click", async () => {
    console.log("🔐 [DASHBOARD-ADMIN] Cambio password…");

    const oldP = clean(document.getElementById("oldAdminPassword").value);
    const newP = clean(document.getElementById("newAdminPassword").value);
    const msg = document.getElementById("msgAdminPassword");

    const data = await adminApi("/api/admin/cambiaPassword", {
      method: "POST",
      body: JSON.stringify({ oldP, newP })
    });

    if (!data) {
      msg.textContent = "Errore cambio password.";
      return;
    }

    msg.textContent = data.message || "Password aggiornata.";
  });
}
