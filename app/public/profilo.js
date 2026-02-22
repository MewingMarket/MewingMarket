document.addEventListener("DOMContentLoaded", () => {

  const session = localStorage.getItem("session");
  const email = localStorage.getItem("email");

  if (!session || !email) {
    window.location.href = "login.html";
    return;
  }

  // Mostra email
  document.getElementById("userEmail").textContent = email;

  // Carica data registrazione (se la vuoi mostrare)
  // Puoi aggiungere un endpoint dedicato se serve

  // ============================================================
  // CAMBIO EMAIL
  // ============================================================
  document.getElementById("btnCambiaEmail").onclick = async () => {
    const newEmail = document.getElementById("newEmail").value;
    const msg = document.getElementById("msgEmail");

    const res = await fetch("/api/utente/profilo/cambia-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session,
        "x-email": email
      },
      body: JSON.stringify({ newEmail })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Email aggiornata!";
      localStorage.setItem("email", newEmail);
      document.getElementById("userEmail").textContent = newEmail;
    } else {
      msg.textContent = data.error || "Errore";
    }
  };

  // ============================================================
  // CAMBIO PASSWORD
  // ============================================================
  document.getElementById("btnCambiaPassword").onclick = async () => {
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const msg = document.getElementById("msgPassword");

    const res = await fetch("/api/utente/profilo/cambia-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session,
        "x-email": email
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });

    const data = await res.json();

    msg.textContent = data.success ? "Password aggiornata!" : data.error;
  };

  // ============================================================
  // UPLOAD FOTO PROFILO
  // ============================================================
  document.getElementById("uploadFoto").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("foto", file);

    const res = await fetch("/api/utente/profilo/foto", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + session,
        "x-email": email
      },
      body: form
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById("fotoProfilo").src = data.foto;
    }
  };

  // ============================================================
  // ELIMINA ACCOUNT
  // ============================================================
  document.getElementById("btnEliminaAccount").onclick = async () => {
    const msg = document.getElementById("msgElimina");

    const res = await fetch("/api/utente/profilo/elimina", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session,
        "x-email": email
      }
    });

    const data = await res.json();

    if (data.success) {
      localStorage.clear();
      window.location.href = "login.html";
    } else {
      msg.textContent = data.error;
    }
  };

});
