const axios = require("axios");

async function inviaNewsletter({ oggetto, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const listaId = 8;

  const payload = {
    sender: { name: "MewingMarket", email: "vendite@mewingmarket.it" },
    name: oggetto,
    subject: oggetto,
    htmlContent: html,
    recipients: { listIds: [listaId] },
    scheduledAt: new Date().toISOString()
  };

  try {
    const res = await axios.post("https://api.brevo.com/v3/emailCampaigns", payload, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Newsletter inviata via Brevo:", res.data.id);
    return res.data;
  } catch (err) {
    console.error("❌ Errore invio Brevo:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { inviaNewsletter };
