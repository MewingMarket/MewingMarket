console.log("[PROFILO] Caricato");

/* =========================================================
   CAMBIO EMAIL
========================================================= */
document.getElementById("btnCambiaEmail")?.addEventListener("click", async () => {
  const nuova_email = document.getElementById("newEmail").value.trim();
  const password = document.getElementById("passwordEmail").value.trim();
  const msg = document.getElementById("msgEmail");

  msg.textContent = "";

  if (!nuova_email || !password) {
    msg.textContent = "Compila tutti i campi.";
    return;
  }

  const token = localStorage.getItem("token");

  try {
    // ⭐ PATCH 2027.300 — usa fetchCritico globale + alias API
    const res = await window.fetchCritico(
      "/utenti/cambia-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ nuova_email, password })
      },
      { retries: 2, backoffMs: 300 }
    );

    const data = await res.json();

    if (!data.success) {
      msg.textContent = data.error || "Errore";
      return;
    }

    msg.textContent = "Email aggiornata con successo.";
    document.getElementById("newEmail").value = "";
    document.getElementById("passwordEmail").value = "";

  } catch (err) {
    msg.textContent = "Errore di connessione.";
  }
});

/* =========================================================
   CAMBIO PASSWORD
========================================================= */
document.getElementById("btnCambiaPassword")?.addEventListener("click", async () => {
  const nuova_password = document.getElementById("newPassword").value.trim();
  const msg = document.getElementById("msgPassword");

  msg.textContent = "";

  if (!nuova_password) {
    msg.textContent = "Inserisci la nuova password.";
    return;
  }

  const token = localStorage.getItem("token");

  try {
    // ⭐ PATCH 2027.300 — usa fetchCritico globale + alias API
    const res = await window.fetchCritico(
      "/utenti/cambia-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ nuova_password })
      },
      { retries: 2, backoffMs: 300 }
    );

    const data = await res.json();

    if (!data.success) {
      msg.textContent = data.error || "Errore";
      return;
    }

    msg.textContent = "Password aggiornata con successo.";
    document.getElementById("oldPassword").value = "";
    document.getElementById("newPassword").value = "";

  } catch (err) {
    msg.textContent = "Errore di connessione.";
  }
});
