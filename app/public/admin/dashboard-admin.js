/* =========================================================
   DASHBOARD ADMIN — GESTIONE PROFILO
========================================================= */

const clean = (t) => typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : t ?? "";

async function adminGet(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}), Authorization: token ? `Bearer ${token}` : "" };
  const res = await window.fetchUniversale(path, { ...options, headers }, { retries: 3, backoffMs: 400 });
  
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return null;
  }
  return res;
}

document.addEventListener("critical-ready", () => {
  popolaDatiAdmin();
  setupCambioEmail();
  setupCambioPassword();
});

async function popolaDatiAdmin() {
  const res = await adminGet("/api/admin/me");
  if (!res) return;
  const data = await res.json();
  if (data.success && data.admin) {
    const a = data.admin;
    if (document.getElementById("adminEmailMain")) document.getElementById("adminEmailMain").textContent = a.email;
    if (document.getElementById("adminUsernameMain")) document.getElementById("adminUsernameMain").textContent = a.email.split("@")[0];
    if (document.getElementById("adminCFMain")) document.getElementById("adminCFMain").textContent = a.codice_fiscale;
    if (document.getElementById("adminRoleMain")) document.getElementById("adminRoleMain").textContent = a.ruolo;
  }
}

function setupCambioEmail() {
  document.getElementById("btnAdminCambiaEmail")?.addEventListener("click", async () => {
    const nuova = clean(document.getElementById("newAdminEmail").value);
    const pass = clean(document.getElementById("passwordAdminEmail").value);
    const msg = document.getElementById("msgAdminEmail");

    const res = await adminGet("/api/admin/cambia-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuova, pass })
    });
    if (!res) return;
    const data = await res.json();
    msg.textContent = data.message || data.error;
    if (data.success) setTimeout(() => location.reload(), 1000);
  });
}

function setupCambioPassword() {
  document.getElementById("btnAdminCambiaPassword")?.addEventListener("click", async () => {
    const oldP = clean(document.getElementById("oldAdminPassword").value);
    const newP = clean(document.getElementById("newAdminPassword").value);
    const msg = document.getElementById("msgAdminPassword");

    const res = await adminGet("/api/admin/cambia-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldP, newP })
    });
    if (!res) return;
    const data = await res.json();
    msg.textContent = data.message || data.error;
  });
}
