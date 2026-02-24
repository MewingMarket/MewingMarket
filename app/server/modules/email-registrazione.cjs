// app/server/modules/email-registrazione.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");

async function inviaEmailRegistrazione({ email }) {
  const subject = "Benvenuto su MewingMarket 🐾";

  const html = `
  <html>
    <body style="font-family: system-ui; background:#0b1120; color:#e5e7eb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        <h1 style="color:#38bdf8;font-size:24px;margin-bottom:16px;">Benvenuto in MewingMarket</h1>
        <p>La tua registrazione è avvenuta con successo.</p>
        <p>Usa <strong>${email}</strong> per accedere alla tua area riservata.</p>
      </div>
    </body>
  </html>
  `;

  await inviaEmailLista({ email, listId: 9, subject, html });
}

module.exports = { inviaEmailRegistrazione };
