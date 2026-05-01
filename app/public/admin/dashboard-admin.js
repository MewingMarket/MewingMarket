/* =========================================================
   DASHBOARD ADMIN — UNIVERSAL JSON PATCH 2027.970
   - Token Fix
   - Universal JSON
   - Router Universale
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

  // Token scaduto
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    return null;
  }

  // universal-json
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
  const data = await adminApi("/api/admin/me", { method: "GET" });
  if (!data || !data.admin) return;

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
   /api/admin/cambiaPassword
========================================================= */
function setupCambioPassword() {
  const btn = document.getElementById("btnAdminCambiaPassword");
  if (!btn) return;

  btn.addEventListener("click", async () => {
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
