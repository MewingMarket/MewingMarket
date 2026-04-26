/* =========================================================
   File: app/public/profilo.js
   Gestione Modifica Email e Password
   Versione: 2027.400 — FETCH UNIVERSALE + CRITICAL READY
========================================================= */

console.log("[PROFILO] Caricato");

/* =========================================================
   INIT — Avvio sincronizzato con critical-ready
========================================================= */
document.addEventListener("critical-ready", () => {

  /* =========================================================
     1) CAMBIO EMAIL
  ========================================================== */
  document.getElementById("btnCambiaEmail")?.addEventListener("click", async () => {
    const nuova_email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("passwordEmail").value.trim();
    const msg = document.getElementById("msgEmail");

    if (!msg) return;
    msg.textContent = "";
    msg.className = "status"; // Reset classi CSS

    if (!nuova_email || !password) {
      msg.textContent = "Compila tutti i campi.";
      msg.classList.add("err");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await window.fetchUniversale(
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
        msg.textContent = data.error || "Errore durante l'aggiornamento.";
        msg.classList.add("err");
        return;
      }

      msg.textContent = "Email aggiornata con successo.";
      msg.classList.add("ok");
      
      // Pulisce i campi
      document.getElementById("newEmail").value = "";
      document.getElementById("passwordEmail").value = "";

      // Opzionale: Aggiorna l'email salvata localmente se necessario
      // localStorage.setItem("email", nuova_email);

    } catch (err) {
      console.error("[PROFILO] Errore cambio email:", err);
      msg.textContent = "Errore di connessione.";
      msg.classList.add("err");
    }
  });

  /* =========================================================
     2) CAMBIO PASSWORD
  ========================================================== */
  document.getElementById("btnCambiaPassword")?.addEventListener("click", async () => {
    const vecchia_password = document.getElementById("oldPassword")?.value.trim();
    const nuova_password = document.getElementById("newPassword")?.value.trim();
    const msg = document.getElementById("msgPassword");

    if (!msg) return;
    msg.textContent = "";
    msg.className = "status";

    if (!nuova_password || !vecchia_password) {
      msg.textContent = "Inserisci la password attuale e quella nuova.";
      msg.classList.add("err");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await window.fetchUniversale(
        "/utenti/cambia-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({ 
            vecchia_password, // Aggiunto per matchare solitamente il backend
            nuova_password 
          })
        },
        { retries: 2, backoffMs: 300 }
      );

      const data = await res.json();

      if (!data.success) {
        msg.textContent = data.error || "Errore durante l'aggiornamento.";
        msg.classList.add("err");
        return;
      }

      msg.textContent = "Password aggiornata con successo.";
      msg.classList.add("ok");
      
      // Pulisce i campi
      if (document.getElementById("oldPassword")) document.getElementById("oldPassword").value = "";
      if (document.getElementById("newPassword")) document.getElementById("newPassword").value = "";

    } catch (err) {
      console.error("[PROFILO] Errore cambio password:", err);
      msg.textContent = "Errore di connessione.";
      msg.classList.add("err");
    }
  });

});
