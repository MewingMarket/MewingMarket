/* =========================================================
   LOGIN.JS — Versione definitiva
========================================================= */

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

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

  if (redirect) {
    location.href = redirect;
  } else {
    location.href = "index.html";
  }
});
