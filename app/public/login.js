/* =========================================================
   LOGIN.JS — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [LOGIN] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [LOGIN] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [LOGIN] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [LOGIN] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [LOGIN] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [LOGIN] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [LOGIN] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [LOGIN] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [LOGIN] critical-ready già presente → avvio login");

  avviaLogin();
}

/* =========================================================
   CODICE ORIGINALE INCAPSULATO
========================================================= */
function avviaLogin() {
  console.log("🔥 login.js READY");

  if (window.__loginInit) {
    console.log("⛔ [LOGIN] initLogin già eseguito");
    return;
  }
  window.__loginInit = true;

  const form = document.getElementById("login-form");
  if (!form) {
    console.warn("❌ [LOGIN] login-form NON trovato");
    return;
  }

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiLogin(path, payload = {}) {
    console.log("🌐 [LOGIN] API:", path);

    let res;
    try {
      res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("❌ [LOGIN] Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.warn("⚠️ [LOGIN] Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [LOGIN] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     LOG EVENTO
  ========================================================== */
  async function logUserEvent(evento) {
    const email = localStorage.getItem("email") || "";
    if (!email) {
      console.warn("⚠️ [LOGIN] Nessuna email per log evento");
      return;
    }

    console.log("📝 [LOGIN] Log evento:", evento);

    await apiLogin("/api/utenti/evento", { email, evento });
  }

  /* =========================================================
     SUBMIT LOGIN — VERSIONE BLINDATA
  ========================================================== */
  form.addEventListener("submit", async (e) => {
    console.log("📨 [LOGIN] Submit login");
    e.preventDefault();

    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value.trim();

    if (!email || !password) {
      alert("Inserisci email e password.");
      return;
    }

    if (form.dataset.lock === "1") {
      console.warn("⛔ [LOGIN] Form lock attivo");
      return;
    }
    form.dataset.lock = "1";

    console.log("🔐 [LOGIN] Invio credenziali…");

    const data = await apiLogin("/api/utenti/login", { email, password });

    console.log("📦 [LOGIN] Risposta login:", data);

    if (!data) {
      alert("Credenziali non valide o servizio non disponibile.");
      form.dataset.lock = "0";
      return;
    }

    /* =====================================================
       SALVATAGGIO CORRETTO
    ===================================================== */
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
    localStorage.setItem("ruolo", data.ruolo || "user");

    /* =====================================================
       PATCH EVENTO
    ===================================================== */
    logUserEvent("login");

    /* =====================================================
       Sessione attiva
    ===================================================== */
    localStorage.setItem("sessionState", "1");

    /* =====================================================
       Redirect intelligente
    ===================================================== */
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");

    console.log("➡️ [LOGIN] Redirect:", redirect || "index.html");

    location.href = redirect || "index.html";

    form.dataset.lock = "0";
  });
}
