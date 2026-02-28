// app/server/modules/email-reset-password.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_CREDENZIALI } = require("./liste-brevo.cjs");
const { SENDER_CREDENZIALI } = require("./email-senders.cjs");

async function inviaEmailResetPassword({ email, link }) {
  const subject = "Reimposta la tua password";

  const html = `
<!DOCTYPE html>
<html lang="it">
<body>
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6;">

  <h2 style="text-align:center;color:#333;">Reimposta la tua password</h2>

  <p style="font-size:16px;color:#444;">
    Hai richiesto di reimpostare la password del tuo account.
  </p>

  <p style="text-align:center;margin:25px 0;">
    <a href="${link}" 
       style="background:#007bff;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
       Reimposta Password
    </a>
  </p>

  <p style="font-size:14px;color:#777;">
    Se non hai richiesto tu questa operazione, ignora questa email.
  </p>

</div>
</body>
</html>
`;

  return inviaEmailLista({
    email,
    listId: LISTA_CREDENZIALI,
    subject,
    html,
    sender: SENDER_CREDENZIALI
  });
}

module.exports = { inviaEmailResetPassword };
