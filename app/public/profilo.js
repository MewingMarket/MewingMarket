/* =========================================================
   PROFILO.JS — Gestione Banner Dati + Form Modifica
========================================================= */
document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // --- 1) Caricamento dati nel Banner (come da foto) ---
  try {
    const res = await window.fetchUniversale("/api/utenti/me", {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();

    if (data.success && data.utente) {
      const u = data.utente;
      document.getElementById("username").textContent = u.username || u.email.split('@')[0];
      document.getElementById("userEmail").textContent = u.email;
      document.getElementById("userCF").textContent = u.codice_fiscale || "";
    }
  } catch (err) {
    console.error("Errore caricamento dati profilo:", err);
  }

  // --- 2) Logica Cambio Email ---
  document.getElementById("btnCambiaEmail")?.addEventListener("click", async () => {
    const nuova_email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("passwordEmail").value.trim();
    const msg = document.getElementById("msgEmail");

    try {
      const res = await window.fetchUniversale("/api/utenti/cambia-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ nuova_email, password })
      });
      const resData = await res.json();
      msg.textContent = resData.success ? "Email aggiornata!" : resData.error;
      if (resData.success) setTimeout(() => location.reload(), 1000);
    } catch (e) { msg.textContent = "Errore di connessione."; }
  });

  // --- 3) Logica Cambio Password ---
  document.getElementById("btnCambiaPassword")?.addEventListener("click", async () => {
    const vecchia_password = document.getElementById("oldPassword").value;
    const nuova_password = document.getElementById("newPassword").value;
    const msg = document.getElementById("msgPassword");

    try {
      const res = await window.fetchUniversale("/api/utenti/cambia-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ vecchia_password, nuova_password })
      });
      const resData = await res.json();
      msg.textContent = resData.success ? "Password aggiornata!" : resData.error;
    } catch (e) { msg.textContent = "Errore di connessione."; }
  });
});
