/* =========================================================
   DASHBOARD ADMIN — Versione 2026.70 + PATCH USERNAME + CF
   Gestione profilo admin (email + password)
   PATCH 2027.300 — usa adminGet + fetchCritico globale
========================================================= */

// Sanitizzazione sicura
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

/* =========================================================
   PATCH — adminGet (usa fetchCritico globale + token)
========================================================= */
async function adminGet(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await window.fetchCritico(
    path,
    {
      ...options,
      headers
    }
  );

  // Gestione accesso negato
  if (res.status === 401 || res.status === 403) {
    console.warn("[ADMIN] Accesso negato → token non valido");

    localStorage.removeItem("token");
    localStorage.removeItem("email");

    window.location.href = "/login.html";
    return null;
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
   1) Popola dati admin nella pagina (EMAIL + USERNAME + CF + RUOLO)
========================================================= */
async function popolaDatiAdmin() {
  try {
    const res = await adminGet("/api/utenti/me", { method: "GET" });
    if (!res) return;

    const data = await res.json();
    if (!data.success || !data.utente) return;

    const email = clean(data.utente.email);
    const username = email.split("@")[0];
    const cf = clean(data.utente.codice_fiscale);
    const ruolo = clean(data.utente.ruolo || "Admin");

    // Salvo email in localStorage per coerenza
    localStorage.setItem("email", email);

    // Popola UI
    const emailSpan = document.getElementById("adminEmailMain");
    const usernameSpan = document.getElementById("adminUsernameMain");
    const cfSpan = document.getElementById("adminCFMain");
    const ruoloSpan = document.getElementById("adminRoleMain");

    if (emailSpan) emailSpan.textContent = email;
    if (usernameSpan) usernameSpan.textContent = username;
    if (cfSpan) cfSpan.textContent = cf;
    if (ruoloSpan) ruoloSpan.textContent = ruolo;

  } catch (err) {
    console.error("[ADMIN] Errore caricamento dati admin:", err);
  }
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
      const res = await adminGet("/api/admin/cambia-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuova, pass })
      });

      if (!res) return;

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
      const res = await adminGet("/api/admin/cambia-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldP, newP })
      });

      if (!res) return;

      const data = await res.json();
      msg.textContent = data.message || data.error;

    } catch (err) {
      msg.textContent = "Errore di connessione.";
    }
  });
}
