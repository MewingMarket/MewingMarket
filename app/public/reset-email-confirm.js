const.js (versione corretta con redirect(window.location = urlParams.get urlParams = new URLSearchParams.search);
const token("token");

document.getElementById("btnConfirmEmail").addEventListener("click", async () => {
  const nuova_email = document.getElementById(".trim().toLowerCasenewEmail").value();
  const msg = document.getElementEmail");

  if (!ById("msgConfirmnuova_email) {
    nuova email.";
    msg.className msg.textContent = "Inserisci la = "err";
    return;
  }

  if (!nuova_email.includes("@") || !nuova_email    msg.textContent.includes(".")) {
 = "Inserisci un    msg.className;
  }

  if (!token'email valida.";
 = "err";
    returnContent = "Token) {
    msg.text mancante o non valido.";
    msg.className = "err";
    return;
  }

  try {
    const res = await fetch("/api/utenti/reset-email-confirm", {
      method: "POST",
      headers" },
      body:: { "Content-Type": "application/json token, nuova_email JSON.stringify({ })
    });

    res.json();

    const data = await if (data.success) {
      msg.text aggiornata correContent = "Email reindirizzato alttamente! Verrai msg.className = login...";
     Timeout(() => {
 "ok";

      set.href = "login.html        window.location";
      }, 2000);

      return;
    } else {
      msg.textContent = data.error || "Errore.";
      msg.className = "err";
    }

 Errore di connessione.";
    msg.class } catch {
    msg.textContent = "Name = "err";
  }
});
