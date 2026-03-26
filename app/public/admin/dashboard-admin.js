/* =========================================================
   DASHBOARD ADMIN — Versione 2026.70
   Gestione profilo admin (email + password)
   PATCH: adminFetch integrato nel file
========================================================= */

// Sanitizzazione sicura
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

/* =========================================================
   PATCH — adminFetch integrato
   Usa fetch normale ma aggiunge token + controlli admin
========================================================= */
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetch(url, { ...options, headers });

  // Se non autorizzato → redirect login admin
  if (res.status === 401 || res.status === 403) {
    console.warn("[ADMIN] Accesso negato → redirect login");
    window.location.href = "/admin/login.html";
    return;
  }

  return res;
}

/* =========================================================
   INIT — Avvio solo dopo caricamento header/footer/head
========================================================= */
document.addEventListener("admin-header-loaded", () => {
  console.log("[ADMIN] Dashboard profilo inizializzata");

  popolaDatiAdmin();
  setupCambioEmail();
  setupCambioPassword();
});

/* =========================================================
   1) Popola dati admin nella pagina
========================================================= */
function popolaDatiAdmin() {
  const email = localStorage.getItem("email") || "—";

  const emailSpan = document.getElementById("adminEmailMain");
  const ruoloSpan = document.getElementById("adminRoleMain");

  if (emailSpan) emailSpan.textContent = clean(email);
  if (ruoloSpan) ruoloSpan.textContent = "Admin";
}

/* =========================================================
   2) Cambia email admin
========================================================= */
function setupCambioEmail() {
  const btn = document.getElementById("btnAdminCambiaEmail");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const nuova = clean(document.getElementById("newAdminEmail").value);
    const pass = clean(document.getElementById("passwordAdminEmail").value);
    const msg = document.getElementById("msgAdminEmail");

    if (!nuova || !pass) {
      msg.textContent = "Compila tutti i campi.";
      return;
    }

    try {
      const res = await adminFetch("/api/admin/cambia-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuova, pass })
      });

      const data = await res.json();
      msg.textContent = data.message || data.error;

      if (data.success) {
        localStorage.setItem("email", nuova);
        popolaDatiAdmin();
      }

    } catch (err) {
      msg.textContent = "Errore di connessione.";
    }
  });
}

/* =========================================================
   3) Cambia password admin
========================================================= */
function setupCambioPassword() {
  const btn = document.getElementById("btnAdminCambiaPassword");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const oldP = clean(document.getElementById("oldAdminPassword").value);
    const newP = clean(document.getElementById("newAdminPassword").value);
    const msg = document.getElementById("msgAdminPassword");

    if (!oldP || !newP) {
      msg.textContent = "Compila tutti i campi.";
      return;
    }

    try {
      const res = await adminFetch("/api/admin/cambia-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldP, newP })
      });

      const data = await res.json();
      msg.textContent = data.message || data.error;

    } catch (err) {
      msg.textContent = "Errore di connessione.";
    }
  });
}
