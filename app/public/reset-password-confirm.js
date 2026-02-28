const urlParams = new URLSearchParams(window.location("token");

document = urlParams.getaddEventListener.getElementById("btnConfirmReset").("click", async ()_password = document => {
  const nuova.getElementById("newPassword").value.getElementById(".trim();
  const conferma = documentconfirmPassword").value.trim();
  const msg = document.getElementById("msgConfirmReset");

 || !conferma) {
  if (!nuova_password    msg.textContent = "Compila tutti i campi.";
    msg.className = "err";
    return;
  }

  if (nuova_password !== conferma) {
    msg.textContent msg.className = = "Le password non coincidono.";
    "err";
    return;
  }

  if (!tokenContent = "Token) {
    msg.text mancante o non valido.";
    msg.class return;
  }

  tryName = "err";
    {
    const resapi/utenti/reset = await fetch("/-password-confirm", {
      method: "POST",
      headers JSON.stringify({: { "Content-Type": "application/json" },
      body: token, nuova_password })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Password aggiornata! Verrai reindirizzato al login...";
      msg.className = "ok";

      set.href = "login.htmlTimeout(() => {
        window.location";
      }, 2000);

      return;
    } else {
      msg.textContent msg.className = = data.error || "Errore.";
      "err";
    }

 .";
    msg.class } catch {
    msg.textContent = "Errore di connessione});
