// app/public/admin/js/login.js

const statusEl = document.getElementById("status");
const input = document.getElementById("adminPassword");
const btn = document.getElementById("loginBtn");

function setStatus(msg, ok = false) {
  statusEl.textContent = msg;
  statusEl.style.color = ok ? "green" : "red";
}

btn.addEventListener("click", async () => {
  const password = input.value.trim();
  if (!password) {
    setStatus("Inserisci la password");
    return;
  }

  setStatus("Accesso in corso...");

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();

    if (!data.success || !data.token) {
      setStatus(data.error || "Accesso negato");
      return;
    }

    localStorage.setItem("adminToken", data.token);
    setStatus("Accesso riuscito", true);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
});
