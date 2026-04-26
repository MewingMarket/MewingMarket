/* =========================================================
   PROFILO.JS — Gestione Banner Dati + Aggiornamenti
========================================================= */
console.log("[PROFILO] Inizializzazione...");

document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // 1. Caricamento dati per il Banner (Username, Email, CF)
  try {
    const res = await window.fetchUniversale("/api/utenti/me", {
      method: "GET",
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();

    if (data.success && data.utente) {
      const u = data.utente;
      // Popoliamo esattamente come da foto
      document.getElementById("username").textContent = u.username || u.email.split('@')[0];
      document.getElementById("userEmail").textContent = u.email || "";
      document.getElementById("userCF").textContent = u.codice_fiscale || "N/A";
    }
  } catch (err) {
    console.error("[PROFILO] Errore caricamento banner:", err);
  }

  // 2. Logica Cambio Email
  document.getElementById("btnCambiaEmail")?.addEventListener("click", async () => {
    const nuova_email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("passwordEmail").value.trim();
    const msg = document.getElementById("msgEmail");

    if (!nuova_email || !password) {
      msg.textContent = "Compila tutti i campi.";
      msg.className = "status-msg err";
      return;
    }

    try {
      const res = await window.fetchUniversale("/api/utenti/cambia-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ nuova_email, password })
      });
      const resData = await res.json();
      
      if (resData.success) {
        msg.textContent = "Email aggiornata con successo!";
        msg.className = "status-msg ok";
        setTimeout(() => location.reload(), 1500); // Ricarica per aggiornare il banner
      } else {
        msg.textContent = resData.error || "Errore.";
        msg.className = "status-msg err";
      }
    } catch (e) {
      msg.textContent = "Errore di connessione.";
      msg.className = "status-msg err";
    }
  });

  // 3. Logica Cambio Password
  document.getElementById("btnCambiaPassword")?.addEventListener("click", async () => {
    const vecchia_password = document.getElementById("oldPassword").value.trim();
    const nuova_password = document.getElementById("newPassword").value.trim();
    const msg = document.getElementById("msgPassword");

    if (!vecchia_password || !nuova_password) {
      msg.textContent = "Inserisci entrambe le password.";
      msg.className = "status-msg err";
      return;
    }

    try {
      const res = await window.fetchUniversale("/api/utenti/cambia-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ vecchia_password, nuova_password })
      });
      const resData = await res.json();

      if (resData.success) {
        msg.textContent = "Password aggiornata!";
        msg.className = "status-msg ok";
        document.getElementById("oldPassword").value = "";
        document.getElementById("newPassword").value = "";
      } else {
        msg.textContent = resData.error || "Errore.";
        msg.className = "status-msg err";
      }
    } catch (e) {
      msg.textContent = "Errore di connessione.";
      msg.className = "status-msg err";
    }
  });
});
