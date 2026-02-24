// app/server/modules/email-novita.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");

async function inviaEmailNovita({ email, titolo, contenuto }) {
  const subject = titolo || "Nuove novità da MewingMarket";

  const html = `
  <html>
    <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        <h1 style="color:#a855f7;font-size:22px;">${subject}</h1>
        <p>${contenuto}</p>
      </div>
    </body>
  </html>
  `;

  await inviaEmailLista({ email, listId: 13, subject, html });
}

module.exports = { inviaEmailNovita };
