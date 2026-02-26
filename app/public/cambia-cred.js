// =========================================================
// Cambia Credenziali – MewingMarket (VERSIONE DEFINITIVA)
// =========================================================

const statusBox = document.getElementById("status");

function setStatus(msg, ok = false) {
  if (!statusBox) return;
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "#4ade80" : "#f97373";
}

function getUserToken() {
  return localStorage.getItem("token");
}

// =========================================================
// MOSTRA SOLO IL FORM GIUSTO
// =========================================================

const formEmail = document.getElementById("change-email-form");
const formPassword = document.getElementById("change-password-form");

function mostraForm(tipo) {
  setStatus("");

  if (tipo === "email") {
    formEmail.style.display = "block";
    formPassword.style.display = "none";
  } else if (tipo === "password") {
    formEmail.style.display = "none";
    formPassword.style.display = "block";
  }
}

// Link attivazione (registrazione.js li punta qui)
document.getElementById("link-cambia-email")?.addEventListener("click", () => {
  mostraForm("email");
});

document.getElementById("link-cambia-password")?.addEventListener("click", () => {
  mostraForm("password");
});

// Default: nessun form visibile finché non clicchi
mostraForm(null);

// =========================================================
// 1) CAMBIA EMAIL
// =========================================================

formEmail?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const nuova_email = e.target.newEmail.value.trim().toLowerCase();
  const password = e.target.password.value.trim();
  const token = getUserToken();

  if (!token) {
    setStatus("Devi effettuare il login");
    return;
  }

  if (!nuova_email.includes("@") || !nuova_email.includes(".")) {
    setStatus("Email non valida");
    return;
  }

  try {
    const res = await fetch("/api/utenti/cambia-email", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-token": token 
      },
      body: JSON.stringify({ token, nuova_email, password })
    });

    const data = await res.json().catch(() => null);

    if (!data) {
      setStatus("Errore del server");
      return;
    }

    if (data.success) {
      setStatus("Email aggiornata con successo", true);

      localStorage.setItem("utenteEmail", nuova_email);

      if (typeof aggiornaFooterUtente === "function") {
        aggiornaFooterUtente();
      }

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

formPassword?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const nuova_password = e.target.newPassword.value.trim();
  const token = getUserToken();

  if (!token) {
    setStatus("Devi effettuare il login");
    return;
  }

  if (nuova_password.length < 6) {
    setStatus("La nuova password deve contenere almeno 6 caratteri");
    return;
  }

  try {
    const res = await fetch("/api/utenti/cambia-password", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-token": token 
      },
      body: JSON.stringify({ token, nuova_password })
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
