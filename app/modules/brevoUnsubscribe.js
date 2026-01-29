// FILE: brevoUnsubscribe.js

const axios = require("axios");

async function disiscriviEmail(email) {
  const apiKey = process.env.BREVO_API_KEY;

  try {
    console.log("📭 Tentativo disiscrizione:", email);

    const response = await axios.post(
      "https://api.brevo.com/v3/contacts/removeFromList",
      {
        emails: [email],
        listIds: [8]
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("🟦 Disiscrizione completata:", response.data);
    return { status: "ok" };

  } catch (err) {
    console.error("❌ Errore disiscrizione Brevo:", err.response?.data || err);
    throw err;
  }
}

module.exports = { disiscriviEmail };
