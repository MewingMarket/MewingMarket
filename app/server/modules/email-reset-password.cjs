// app/server/modules/email-reset-password.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_CREDENZIALI } = require("./liste-brevo.cjs");
const { SENDER_CREDENZIALI } = require("./email-senders.cjs");

async function inviaEmailResetPassword({ email, link }) {
  const subject = "Reimposta la tua password";

  // 🔥 NON inviamo più HTML con il link incorporato
  // 🔥 Passiamo il link come parametro a Brevo
  return inviaEmailLista({
    email,
    listId: LISTA_CREDENZIALI,
    subject,
    html: null, // ← fondamentale per evitare la riscrittura dei link
    sender: SENDER_CREDENZIALI,
    params: {
      link // ← il link reale, con token integro
    }
  });
}

module.exports = { inviaEmailResetPassword };
