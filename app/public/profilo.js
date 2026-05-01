/* =========================================================
   PROFILO.JS — UNIVERSAL JSON PATCH 2027.970
   Gestione Dati Utente + Moduli
========================================================= */

console.log("[PROFILO] Inizializzazione...");

/* =========================================================
   WRAPPER UNIVERSALE (token + universal-json)
========================================================= */
async function apiProfilo(path, options = {}) {
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
    console.error("❌ Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
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
   AVVIO PROFILO
========================================================= */
document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  /* =========================================================
     1. Caricamento dati utente
  ========================================================== */
  const data = await apiProfilo("/api/utenti/me", { method: "GET" });

  if (data && data.utente) {
    const u = data.utente;

    const elEmail = document.getElementById("sidebarEmail");
    const elUser = document.getElementById("sidebarUsername");
    const elCF = document.getElementById("sidebarCF");

    if (elEmail) elEmail.textContent = u.email;
    if (elUser) elUser.textContent = u.username || u.email.split("@")[0];
    if (elCF) elCF.textContent = u.codice_fiscale || "";
  }

  /* =========================================================
     2. Cambio Email
  ========================================================== */
  document.getElementById("btnCambiaEmail")?.addEventListener("click", async () => {
    const nuova_email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("passwordEmail").value.trim();
    const msg = document.getElementById("msgEmail");

    const res = await apiProfilo("/api/utenti/cambiaEmail", {
      method: "POST",
      body: JSON.stringify({ nuova_email, password })
    });

    if (!res) {
      msg.textContent = "Errore.";
      return;
    }

    msg.textContent = "Email aggiornata!";
    setTimeout(() => location.reload(), 1000);
  });

  /* =========================================================
     3. Cambio Password
  ========================================================== */
  document.getElementById("btnCambiaPassword")?.addEventListener("click", async () => {
    const vecchia_password = document.getElementById("oldPassword").value.trim();
    const nuova_password = document.getElementById("newPassword").value.trim();
    const msg = document.getElementById("msgPassword");

    const res = await apiProfilo("/api/utenti/cambiaPassword", {
      method: "POST",
      body: JSON.stringify({ vecchia_password, nuova_password })
    });

    if (!res) {
      msg.textContent = "Errore.";
      return;
    }

    msg.textContent = "Password aggiornata!";
    document.getElementById("oldPassword").value = "";
    document.getElementById("newPassword").value = "";
  });
});
