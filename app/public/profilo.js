document.addEventListener("DOMContentLoaded", () => {

  // ============================
  // SESSIONE CORRETTA
  // ============================
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("utenteEmail");

  if (!token || !email) {
    window.location.href = "login.html";
    return;
  }

  // Mostra email utente
  document.getElementById("userEmail").textContent = email;

  // ============================
  // CAMBIO EMAIL
  // ============================
  document.getElementById("btnCambiaEmail").onclick = async () => {
    const nuova_email = document.getElementById("newEmail").value.trim();
    const password = prompt("Inserisci la tua password attuale");
    const msg = document.getElementById("msgEmail");

    if (!nuova_email || !password) {
      msg.textContent = "Compila tutti i campi.";
      return;
    }

    const res = await fetch("/api/utenti/cambia-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        nuova_email,
        password
      })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Email aggiornata!";
      localStorage.setItem("utenteEmail", nuova_email);
      document.getElementById("userEmail").textContent = nuova_email;
    } else {
      msg.textContent = data.error || "Errore";
    }
  };

  // ============================
  // CAMBIO PASSWORD
  // ============================
  document.getElementById("btnCambiaPassword").onclick = async () => {
    const oldPassword = document.getElementById("oldPassword").value.trim();
    const nuova_password = document.getElementById("newPassword").value.trim();
    const msg = document.getElementById("msgPassword");

    if (!oldPassword || !nuova_password) {
      msg.textContent = "Compila tutti i campi.";
      return;
    }

    // Prima verifichiamo la password attuale
    const resLogin = await fetch("/api/utenti/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: oldPassword })
    });

    const loginData = await resLogin.json();

    if (!loginData.success) {
      msg.textContent = "Password attuale errata.";
      return;
    }

    // Ora aggiorniamo la password
    const res = await fetch("/api/utenti/cambia-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        nuova_password
      })
    });

    const data = await res.json();

    msg.textContent = data.success ? "Password aggiornata!" : data.error;
  };

  // ============================
  // FOTO PROFILO (DISATTIVATA)
  // ============================
  document.getElementById("uploadFoto").onchange = () => {
    alert("⚠️ Funzione foto profilo non ancora attiva nel backend.");
  };

  // ============================
  // ELIMINA ACCOUNT
  // ============================
  document.getElementById("btnEliminaAccount").onclick = async () => {
    const password = prompt("Conferma la tua password per eliminare l'account");
    const msg = document.getElementById("msgElimina");

    if (!password) {
      msg.textContent = "Password richiesta.";
      return;
    }

    const res = await fetch("/api/utenti/elimina-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.clear();
      window.location.href = "login.html";
    } else {
      msg.textContent = data.error || "Errore.";
    }
  };

});
