// app/server/scripts/invia-novita.js
const axios = require("axios");
const { inviaEmailNovita } = require("../modules/email-novita.cjs");
const { LISTA_NEWSLETTER } = require("../modules/liste-brevo.cjs");

const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function getIscrittiNewsletter() {
  const url = `https://api.brevo.com/v3/contacts/lists/${LISTA_NEWSLETTER}/contacts`;

  const res = await axios.get(url, {
    headers: {
      "api-key": BREVO_API_KEY
    }
  });

  return res.data?.contacts?.map(c => c.email) || [];
}

async function inviaNovitaATutti() {
  const emails = await getIscrittiNewsletter();

  for (const email of emails) {
    await inviaEmailNovita({ email });
  }

  console.log("✔️ Newsletter novità inviata a tutti gli iscritti.");
}

module.exports = { inviaNovitaATutti };
