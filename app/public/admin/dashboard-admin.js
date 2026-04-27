/* =========================================================
   DASHBOARD ADMIN — GESTIONE PROFILO (Versione Coerente 2027)
   PATCH 2027.900 — fetch nativo + endpoint Java‑mode
========================================================= */

const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

/* =========================================================
   WRAPPER ADMIN — aggiunge token + fallback 401/403
========================================================= */
async function adminGet(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    return null;
  }

  return res;
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("critical-ready", () => {
  popolaDatiAdmin();
  setupCambioEmail();
  setupCambioPassword();
});

/* =========================================================
   1) POPOLA DATI PROFILO ADMIN
   /api/admin/me
========================================================= */
async function popolaDatiAdmin() {
  const res = await adminGet("/api/admin/me");
  if (!res) return;

  const data = await res.json();

  if (data.success && data.admin) {
    const a = data.admin;

    const emailEl = document.getElementById("adminEmailMain");
    const userEl = document.getElementById("adminUsernameMain");
    const cfEl = document.getElementById("adminCFMain");
    const roleEl = document.getElementById("adminRoleMain");

    if (emailEl) emailEl.textContent = a.email;
    if (userEl) userEl.textContent = a.email.split("@")[0];
    if (cfEl) cfEl.textContent = a.codice_fiscale;
    if (roleEl) roleEl.textContent = a.ruolo;
  }
}

/* =========================================================
   2) CAMBIO EMAIL
   /api/admin/cambiaEmail
========================================================= */
function setupCambioEmail() {
  const btn = document.getElementById("btnAdminCambiaEmail");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const nuova = clean(document.getElementById("newAdminEmail").value);
    const pass = clean(document.getElementById("passwordAdminEmail").value);
    const msg = document.getElementById("msgAdminEmail");

    const res = await adminGet("/api/admin/cambiaEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuova, pass })
    });

    if (!res) return;

    const data = await res.json();
    msg.textContent = data.message || data.error;

    if (data.success) {
      setTimeout(() => location.reload(), 1000);
    }
  });
}

/* =========================================================
   3) CAMBIO PASSWORD
   /api/admin/cambiaPassword
========================================================= */
function setupCambioPassword() {
  const btn = document.getElementById("btnAdminCambiaPassword");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const oldP = clean(document.getElementById("oldAdminPassword").value);
    const newP = clean(document.getElementById("newAdminPassword").value);
    const msg = document.getElementById("msgAdminPassword");

    const res = await adminGet("/api/admin/cambiaPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldP, newP })
    });

    if (!res) return;

    const data = await res.json();
    msg.textContent = data.message || data.error;
  });
}
