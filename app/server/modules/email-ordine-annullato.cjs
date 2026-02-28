// app/server/modules/email-ordine-annullato.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_CLIENTI } = require("./liste-brevo.cjs");
const { SENDER_ACQUISTI } = require("./email-senders.cjs");

async function inviaEmailOrdineAnnullato({ email, ordine }) {
  const subject = `Il tuo ordine #${ordine.id_ordine} è stato annullato`;

  const html = `
<!DOCTYPE html>
<html lang="it">
<body>
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6;">

  <h2 style="text-align:center;color:#333;">Ordine annullato</h2>

  <p style="font-size:16px;color:#444;">
    Il tuo ordine <strong>#${ordine.id_ordine}</strong> è stato annullato.
  </p>

  <p style="font-size:16px;color:#444;">
    Se hai domande o pensi ci sia stato un errore, puoi contattarci in qualsiasi momento.
  </p>

  <hr style="margin:30px 0;">

  <p style="font-size:14px;color:#777;text-align:center;">
    Grazie per aver scelto MewingMarket.
  </p>

</div>
</body>
</html>
`;

  return inviaEmailLista({
    email,
    listId: LISTA_CLIENTI,
    subject,
    html,
    sender: SENDER_ACQUISTI
  });
}

module.exports = { inviaEmailOrdineAnnullato };
