// app/server/modules/email-newsletter-unsubscribe.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_NEWSLETTER } = require("./liste-brevo.cjs");
const { SENDER_NEWSLETTER } = require("./email-senders.cjs");

async function inviaEmailNewsletterUnsubscribe({ email }) {
  const subject = "Hai annullato l’iscrizione alla newsletter";

  const html = `
<!DOCTYPE html>
<html lang="it">
<body>
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6;">

  <h2 style="text-align:center;color:#333;">Iscrizione annullata</h2>

  <p style="font-size:16px;color:#444;">
    Hai annullato l’iscrizione alla newsletter di MewingMarket.
  </p>

  <p style="font-size:16px;color:#444;">
    Non riceverai più aggiornamenti, offerte o contenuti esclusivi.
  </p>

  <hr style="margin:30px 0;">

  <p style="font-size:14px;color:#777;text-align:center;">
    Se hai annullato per errore, puoi iscriverti di nuovo dal sito.
  </p>

</div>
</body>
</html>
`;

  return inviaEmailLista({
    email,
    listId: LISTA_NEWSLETTER,
    subject,
    html,
    sender: SENDER_NEWSLETTER
  });
}

module.exports = { inviaEmailNewsletterUnsubscribe };
