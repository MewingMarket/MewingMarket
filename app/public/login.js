/* =========================================================
   LOGIN.JS — Versione definitiva blindata (PATCH SQL)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) {
    console.error("❌ login-form non trovato nel DOM");
    return;
  }

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  if (!emailEl || !passEl) {
    console.error("❌ Campi email/password non trovati nel DOM");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value.trim();

    if (!email || !password) {
      alert("Inserisci email e password.");
      return;
    }

    // PATCH: blocco doppio submit
    if (form.dataset.lock === "1") return;
    form.dataset.lock = "1";

    try {
      const res = await fetch("/api/utenti/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      console.log("[LOGIN] Risposta backend:", data);

      if (!data.success) {
        alert(data.error || "Errore login");
        form.dataset.lock = "0";
        return;
      }

      // ⭐ PATCH: salva token nella chiave corretta
      localStorage.setItem("session", data.token);

      // Salva email e ruolo
      localStorage.setItem("email", data.email);
      localStorage.setItem("ruolo", data.ruolo || "user");

      console.log("[LOGIN] Token salvato:", data.token);
      console.log("[LOGIN] Email salvata:", data.email);
      console.log("[LOGIN] Ruolo salvato:", data.ruolo);

      // Popup post-login
      localStorage.setItem("showLoginChoice", "1");

      // Redirect
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");

      location.href = redirect || "index.html";

    } catch (err) {
      console.error("❌ Errore login:", err);
      alert("Errore di connessione al server");
    } finally {
      form.dataset.lock = "0";
    }
  });
});
