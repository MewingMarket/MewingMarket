/* =========================================================
   LOGIN.JS — Versione definitiva blindata (2026.10)
   Compatibile con auth.js + sessionState
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

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
      const res = await fetch("/api/utenti/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

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
      // ⭐ PATCH 2026.10 — Sessione attiva
      // =====================================================
      // 0 = anonimo
      // 1 = loggato
      // 2 = flusso sensibile (reset, registrazione, ecc.)
      localStorage.setItem("sessionState", "1");

      // =====================================================
      // ⭐ Redirect intelligente
      // =====================================================
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");

      location.href = redirect || "index.html";

    } catch (err) {
      alert("Errore di connessione al server");
    } finally {
      form.dataset.lock = "0";
    }
  });
});
