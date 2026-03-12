/* =========================================================
   LOGIN.JS — Versione definitiva blindata
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

    try {
      const res = await fetch("/api/utenti/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Errore login");
        return;
      }

      // Salva stato login
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("ruolo", data.ruolo || "user");

      // Popup post-login
      localStorage.setItem("showLoginChoice", "1");

      // Redirect
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");

      location.href = redirect || "index.html";

    } catch (err) {
      console.error("❌ Errore login:", err);
      alert("Errore di connessione al server");
    }
  });
});
