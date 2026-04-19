/* =========================================================
   LOGIN.JS — Versione BLINDATA (2027.600)
   - Protezione totale contro API rotte / vuote / HTML
   - Usa fetchUniversale potenziato
   - Nessun blocco, nessuno spinner infinito
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
     PATCH — Helper per registrare evento utente
  ========================================================== */
  async function logUserEvent(evento) {
    try {
      const email = localStorage.getItem("email") || "";
      if (!email) return;

      await window.fetchUniversale(
        "/utenti/evento",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, evento })
        },
        { retries: 2, backoffMs: 300 }
      );

    } catch (err) {
      console.warn("Log evento fallito:", err);
    }
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

    try {
      const res = await window.fetchUniversale(
        "/utenti/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        },
        { retries: 2, backoffMs: 300 }
      );

      /* =====================================================
         PATCH: protezione contro risposte HTML / vuote / {}
      ===================================================== */
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        console.warn("⚠️ Login: risposta non JSON:", err);
        alert("Servizio login non disponibile al momento.");
        form.dataset.lock = "0";
        return;
      }

      if (!data || typeof data !== "object") {
        alert("Errore login (risposta non valida).");
        form.dataset.lock = "0";
        return;
      }

      if (!data.success) {
        alert(data.error || "Credenziali non valide.");
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

    } catch (err) {
      console.error("Errore login:", err);
      alert("Errore di connessione al server.");
    } finally {
      form.dataset.lock = "0";
    }
  });
}
