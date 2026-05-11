/* =========================================================
   PROFILO.JS — UNIVERSAL JSON PATCH 2027.970
   Gestione Dati Utente + Moduli
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [PROFILO] File caricato nel DOM");

/* =========================================================
   WRAPPER UNIVERSALE (token + universal-json)
========================================================= */
async function apiProfilo(path, options = {}) {
  console.log("🌐 [PROFILO] API:", path);

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
    console.error("❌ [PROFILO] Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [PROFILO] Token scaduto → redirect login");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [PROFILO] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [PROFILO] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [PROFILO] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [PROFILO] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [PROFILO] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [PROFILO] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [PROFILO] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [PROFILO] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [PROFILO] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [PROFILO] critical-ready già presente → avvio pagina");

  avviaProfilo();
}

/* =========================================================
   CODICE ORIGINALE INCAPSULATO
========================================================= */
async function avviaProfilo() {
  console.log("🔥 profilo.js READY");

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("🔒 [PROFILO] Nessun token → redirect login");
    window.location.href = "login.html";
    return;
  }

  /* =========================================================
     1. Caricamento dati utente
  ========================================================== */
  console.log("📥 [PROFILO] Carico dati utente…");

  const data = await apiProfilo("/api/utenti/me", { method: "GET" });

  console.log("📦 [PROFILO] Risposta API:", data);

  if (data && data.utente) {
    const u = data.utente;

    const elEmail = document.getElementById("sidebarEmail");
    const elUser = document.getElementById("sidebarUsername");
    const elCF = document.getElementById("sidebarCF");

    if (elEmail) elEmail.textContent = u.email;
    if (elUser) elUser.textContent = u.username || u.email.split("@")[0];
    if (elCF) elCF.textContent = u.codice_fiscale || "";

    console.log("🟢 [PROFILO] Sidebar aggiornata");
  }

  /* =========================================================
     2. Cambio Email
  ========================================================== */
  document.getElementById("btnCambiaEmail")?.addEventListener("click", async () => {
    console.log("✉️ [PROFILO] Cambio email…");

    const nuova_email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("passwordEmail").value.trim();
    const msg = document.getElementById("msgEmail");

    const res = await apiProfilo("/api/utenti/cambiaEmail", {
      method: "POST",
      body: JSON.stringify({ nuova_email, password })
    });

    console.log("📨 [PROFILO] Risposta cambio email:", res);

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
    console.log("🔐 [PROFILO] Cambio password…");

    const vecchia_password = document.getElementById("oldPassword").value.trim();
    const nuova_password = document.getElementById("newPassword").value.trim();
    const msg = document.getElementById("msgPassword");

    const res = await apiProfilo("/api/utenti/cambiaPassword", {
      method: "POST",
      body: JSON.stringify({ vecchia_password, nuova_password })
    });

    console.log("📨 [PROFILO] Risposta cambio password:", res);

    if (!res) {
      msg.textContent = "Errore.";
      return;
    }

    msg.textContent = "Password aggiornata!";
    document.getElementById("oldPassword").value = "";
    document.getElementById("newPassword").value = "";
  });
}
