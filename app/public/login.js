/* =========================================================
   LOGIN.JS — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", initLogin);
document.addEventListener("DOMContentLoaded", initLogin);

function initLogin() {
  if (window.__loginInit) return;
  window.__loginInit = true;

  const form = document.getElementById("login-form");
  if (!form) return;

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  /* =========================================================
     WRAPPER UNIVERSALE (universal-json)
  ========================================================== */
  async function apiLogin(path, payload = {}) {
    let res;
    try {
      res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("❌ Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.warn("⚠️ Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     LOG EVENTO (versione sicura)
  ========================================================== */
  async function logUserEvent(evento) {
    const email = localStorage.getItem("email") || "";
    if (!email) return;

    await apiLogin("/api/utenti/evento", { email, evento });
  }

  /* =========================================================
     SUBMIT LOGIN — VERSIONE BLINDATA
  ========================================================== */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value.trim();

    if (!email || !password) {
      alert("Inserisci email e password.");
      return;
    }

    if (form.dataset.lock === "1") return;
    form.dataset.lock = "1";

    const data = await apiLogin("/api/utenti/login", { email, password });

    if (!data) {
      alert("Credenziali non valide o servizio non disponibile.");
      form.dataset.lock = "0";
      return;
    }

    /* =====================================================
       SALVATAGGIO CORRETTO (token + email + ruolo)
    ===================================================== */
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
    localStorage.setItem("ruolo", data.ruolo || "user");

    /* =====================================================
       PATCH EVENTO: registra login
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

    location.href = redirect || "index.html";

    form.dataset.lock = "0";
  });
}
