// =========================================================
// Cambia Credenziali – MewingMarket (BACKEND READY)
// =========================================================

const statusBox = document.getElementById("status");

function setStatus(msg, ok = false) {
  if (!statusBox) return;
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "#4ade80" : "#f97373";
}

// =========================================================
// 1) CAMBIA EMAIL
// =========================================================

document.getElementById("change-email-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const newEmail = e.target.newEmail.value.trim().toLowerCase();
  const password = e.target.password.value.trim();
  const session = localStorage.getItem("session");

  if (!session) {
    setStatus("Devi effettuare il login");
    return;
  }

  if (!newEmail.includes("@") || !newEmail.includes(".")) {
    setStatus("Email non valida");
    return;
  }

  try {
    const res = await fetch("/api/utente/cambia-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: session, newEmail, password })
    });

    const data = await res.json().catch(() => null);

    if (!data) {
      setStatus("Errore del server");
      return;
    }

    if (data.success) {
      setStatus("Email aggiornata con successo", true);

      // Aggiorna email in localStorage
      localStorage.setItem("utenteEmail", newEmail);

      e.target.reset();
    } else {
      setStatus(data.error || "Errore durante l'aggiornamento email");
    }

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
});

// =========================================================
// 2) CAMBIA PASSWORD
// =========================================================

document.getElementById("change-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const oldPassword = e.target.oldPassword.value.trim();
  const newPassword = e.target.newPassword.value.trim();
  const session = localStorage.getItem("session");

  if (!session) {
    setStatus("Devi effettuare il login");
    return;
  }

  if (newPassword.length < 6) {
    setStatus("La nuova password deve contenere almeno 6 caratteri");
    return;
  }

  try {
    const res = await fetch("/api/utente/cambia-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: session, oldPassword, newPassword })
    });

    const data = await res.json().catch(() => null);

    if (!data) {
      setStatus("Errore del server");
      return;
    }

    if (data.success) {
      setStatus("Password aggiornata con successo", true);
      e.target.reset();
    } else {
      setStatus(data.error || "Errore durante l'aggiornamento password");
    }

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
});
