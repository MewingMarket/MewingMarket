// app/server/modules/email-newsletter.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");

async function inviaEmailNewsletterBenvenuto({ email }) {
  const subject = "Benvenuto nella newsletter MewingMarket";

  const html = `
  <html>
    <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        <h1 style="color:#38bdf8;font-size:22px;">Benvenuto nella newsletter</h1>
        <p>Da ora riceverai aggiornamenti e contenuti esclusivi.</p>
      </div>
    </body>
  </html>
  `;

  await inviaEmailLista({ email, listId: 8, subject, html });
}

module.exports = { inviaEmailNewsletterBenvenuto };
