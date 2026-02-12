const axios = require("axios");

/* =========================================================
   INVIO NEWSLETTER BREVO (blindato)
========================================================= */
async function inviaNewsletter({ oggetto, html }) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const listaId = 8;

    if (!apiKey) {
      console.error("❌ inviaNewsletter: BREVO_API_KEY mancante");
      return { status: "error", message: "API key mancante" };
    }

    if (!oggetto || !html) {
      console.error("❌ inviaNewsletter: oggetto o html mancanti");
      return { status: "error", message: "Contenuto newsletter mancante" };
    }

    const payload = {
      sender: { name: "MewingMarket", email: "vendite@mewingmarket.it" },
      name: oggetto,
      subject: oggetto,
      htmlContent: html,
      recipients: { listIds: [listaId] }
    };

    /* =====================================================
       1️⃣ CREA LA CAMPAGNA
    ====================================================== */
    let create;
    try {
      create = await axios.post(
        "https://api.brevo.com/v3/emailCampaigns",
        payload,
        {
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json"
          }
        }
      );
    } catch (err) {
      console.error("❌ Errore creazione campagna Brevo:", err.response?.data || err.message);
      return { status: "error", message: "Errore creazione campagna" };
    }

    const campaignId = create?.data?.id;
    if (!campaignId) {
      console.error("❌ inviaNewsletter: campaignId non ricevuto");
      return { status: "error", message: "Campagna non creata" };
    }

    console.log("📨 Campagna creata:", campaignId);

    /* =====================================================
       2️⃣ INVIA LA CAMPAGNA
    ====================================================== */
    try {
      await axios.post(
        `https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`,
        {},
        {
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json"
          }
        }
      );
    } catch (err) {
      console.error("❌ Errore invio campagna Brevo:", err.response?.data || err.message);
      return { status: "error", message: "Errore invio campagna" };
    }

    console.log("✅ Newsletter inviata via Brevo:", campaignId);
    return { campaignId, status: "sent" };

  } catch (err) {
    console.error("❌ Errore inviaNewsletter (catch globale):", err.message);
    return { status: "error", message: "Errore interno invio newsletter" };
  }
}

module.exports = { inviaNewsletter };
