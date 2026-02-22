// =========================================================
// File: app/modules/email.cjs
// Invio email di ringraziamento tramite Brevo (Sendinblue)
// =========================================================

const SibApiV3Sdk = require("@getbrevo/brevo");

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER; // es: info@mewingmarket.com
const senderName = "MewingMarket";

const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);

/**
 * Invia email di ringraziamento dopo ordine completato
 */
async function sendOrderEmail({ email, ordine }) {
  // Costruzione lista prodotti con link download
  const prodottiHTML = ordine.prodotti
    .map(
      p => `
      <li style="margin-bottom:6px;">
        <strong>${p.titolo}</strong> — ${p.prezzo}€
        <br>
        <a href="https://mewingmarket.it/api/vendite/download/${p.slug}"
           style="color:#007bff;">Scarica il prodotto</a>
      </li>
    `
    )
    .join("");

  // Template email premium
  const html = `
<div style="font-family:Arial, sans-serif; max-width:600px; margin:auto; color:#333;">

  <h2 style="color:#111; margin-bottom:10px;">
    Grazie per il tuo acquisto da MewingMarket! 🎉
  </h2>

  <p>Ciao!</p>

  <p>
    Abbiamo ricevuto correttamente il tuo ordine.  
    Puoi scaricare il tuo prodotto direttamente dal link che hai ricevuto al momento del pagamento.
  </p>

  <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

  <h3 style="margin-bottom:6px;">📥 ISTRUZIONI RAPIDE</h3>
  <p style="margin:0;">
    1. Scarica il file dal link ricevuto.<br>
    2. Salvalo sul tuo dispositivo.<br>
    3. Segui le indicazioni contenute nel PDF o nel materiale incluso.
  </p>

  <p style="margin-top:10px;">
    Se hai dubbi o difficoltà, siamo sempre disponibili.
  </p>

  <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

  <h3 style="margin-bottom:6px;">📦 RIEPILOGO ORDINE</h3>
  <ul style="padding-left:18px; margin-top:0;">
    ${prodottiHTML}
  </ul>

  <p><strong>Totale:</strong> ${ordine.totale}€</p>

  <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

  <h3 style="margin-bottom:6px;">🧾 NOTE FISCALI</h3>
  <p>
    La ricevuta è emessa come prestazione occasionale ai sensi della normativa italiana.<br>
    Se ti serve una copia aggiuntiva o personalizzata, rispondi direttamente a questa email.
  </p>

  <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

  <h3 style="margin-bottom:6px;">⭐ LASCIA UNA RECENSIONE</h3>
  <p>Il tuo feedback è prezioso:</p>
  <a href="https://mewingmarket.it/recensione.html"
     style="display:inline-block; padding:10px 16px; background:#007bff; color:white; text-decoration:none; border-radius:6px;">
     Lascia una recensione
  </a>

  <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

  <h3 style="margin-bottom:6px;">🎁 RISORSE ESCLUSIVE</h3>
  <p>
    Iscriviti per ricevere contenuti utili e aggiornamenti:<br>
    <a href="https://mewingmarket.it/iscrizione.html">https://mewingmarket.it/iscrizione.html</a>
  </p>

  <p>
    Disiscriviti:<br>
    <a href="https://mewingmarket.it/disiscriviti.html">https://mewingmarket.it/disiscriviti.html</a>
  </p>

  <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

  <h3 style="margin-bottom:6px;">📞 CONTATTI</h3>
  <p>
    Email supporto: <a href="mailto:supporto@mewingmarket.it">supporto@mewingmarket.it</a><br>
    WhatsApp Business: +39 352 026 6660<br>
    Sito ufficiale: <a href="https://mewingmarket.it">https://mewingmarket.it</a>
  </p>

  <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

  <h3 style="margin-bottom:6px;">🌐 SOCIAL</h3>
  <p>
    <a href="https://www.facebook.com/profile.php?id=61584779793628">Facebook</a><br>
    <a href="https://www.instagram.com/mewingmarket">Instagram</a><br>
    <a href="https://www.tiktok.com/@mewingmarket">TikTok</a><br>
    <a href="https://www.youtube.com/@mewingmarket2">YouTube</a><br>
    <a href="https://www.threads.net/@mewingmarket">Threads</a><br>
    <a href="https://x.com/mewingm8">X (Twitter)</a><br>
    <a href="https://www.linkedin.com/in/simone-griseri-5368a7394">LinkedIn</a>
  </p>

</div>
`;

  // Invio email tramite Brevo
  await client.sendTransacEmail({
    sender: { email: senderEmail, name: senderName },
    to: [{ email }],
    subject: "Grazie per il tuo acquisto da MewingMarket! 🎉",
    htmlContent: html
  });
}

module.exports = { sendOrderEmail };
