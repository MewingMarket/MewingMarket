/* =========================================================
   PROFILO.JS — Versione 2027.503 SAFE MODE
   - Compatibile cookie di sessione
   - Nessun token nel localStorage
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
   - Logica originale preservata
========================================================= */

console.log("📌 [PROFILO 2058] File caricato");

/* =========================================================
   WRAPPER UNIVERSALE (SAFE MODE)
========================================================= */
async function apiProfilo(path, options = {}) {
  console.log("🌐 [PROFILO] API:", path);

  let res;
  try {
    res = await fetch(path, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (err) {
    console.error("❌ [PROFILO] Errore rete:", err);
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

  return json; // NON json.data
}

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [PROFILO 2058] pageInit() avviata");
  avviaProfilo();
};

/* =========================================================
   LOGICA PROFILO
========================================================= */
async function avviaProfilo() {
  console.log("🔥 profilo.js READY");

  /* =========================================================
     1. Verifica login tramite /me
  ========================================================== */
  console.log("📥 [PROFILO] Verifica sessione…");

  const me = await apiProfilo("/api/utenti/me", { method: "POST" });

  if (!me || me.guest) {
    console.warn("🔒 [PROFILO] Utente non loggato → redirect login");
    window.location.href = "login.html";
    return;
  }

  const u = me.utente;

  /* =========================================================
     2. Popola sidebar
  ========================================================== */
  const elEmail = document.getElementById("sidebarEmail");
  const elUser = document.getElementById("sidebarUsername");
  const elCF = document.getElementById("sidebarCF");

  if (elEmail) elEmail.textContent = u.email;
  if (elUser) elUser.textContent = u.username || u.email.split("@")[0];
  if (elCF) elCF.textContent = u.codice_fiscale || "";

  console.log("🟢 [PROFILO] Sidebar aggiornata");

  /* =========================================================
     3. Cambio Email
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
     4. Cambio Password
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
