const axios = require("axios");

async function inviaNewsletter({ oggetto, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const listaId = 8;

  const payload = {
    sender: { name: "MewingMarket", email: "vendite@mewingmarket.it" },
    name: oggetto,
    subject: oggetto,
    htmlContent: html,
    recipients: { listIds: [listaId] }
  };

  try {
    // 1️⃣ CREA LA CAMPAGNA
    const create = await axios.post(
      "https://api.brevo.com/v3/emailCampaigns",
      payload,
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    const campaignId = create.data.id;
    console.log("📨 Campagna creata:", campaignId);

    // 2️⃣ INVIA LA CAMPAGNA
    const send = await axios.post(
      `https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`,
      {},
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Newsletter inviata via Brevo:", campaignId);
    return { campaignId, status: "sent" };

  } catch (err) {
    console.error("❌ Errore invio Brevo:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { inviaNewsletter };
