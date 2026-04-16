/* =========================================================
   LOGIN.JS — Versione definitiva blindata (2026.10)
   Compatibile con auth.js + sessionState
   PATCH EVENTI UTENTE: registra evento "login"
   PATCH 2027.300 — usa fetchCritico + apiFetch
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  // ---------------------------------------------------------
  // PATCH — Helper per registrare evento utente
  // ---------------------------------------------------------
  async function logUserEvent(evento) {
    try {
      const email = localStorage.getItem("email") || "";
      if (!email) return;

      await fetchCritico(
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

  // ---------------------------------------------------------
  // SUBMIT LOGIN
  // ---------------------------------------------------------
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
      // ⭐ PATCH 2027.300 — fetchCritico + apiFetch
      const res = await fetchCritico(
        "/utenti/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        },
        { retries: 2, backoffMs: 300 }
      );

      const data = await res.json().catch(() => ({}));

      if (!data.success) {
        alert(data.error || "Errore login");
        form.dataset.lock = "0";
        return;
      }

      // =====================================================
      // ⭐ SALVATAGGIO CORRETTO (token + email + ruolo)
      // =====================================================
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("ruolo", data.ruolo || "user");

      // =====================================================
      // ⭐ PATCH EVENTO: registra login
      // =====================================================
      logUserEvent("login");

      // =====================================================
      // ⭐ Sessione attiva
      // =====================================================
      localStorage.setItem("sessionState", "1");

      // =====================================================
      // ⭐ Redirect intelligente
      // =====================================================
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");

      location.href = redirect || "index.html";

    } catch (err) {
      console.error("Errore login:", err);
      alert("Errore di connessione al server");
    } finally {
      form.dataset.lock = "0";
    }
  });
});
