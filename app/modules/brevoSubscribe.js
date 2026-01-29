// FILE: brevoSubscribe.js

const axios = require("axios");

async function iscriviEmail(email) {
  const apiKey = process.env.BREVO_API_KEY;

  try {
    console.log("📩 Tentativo iscrizione:", email);

    const response = await axios.post(
      "https://api.brevo.com/v3/contacts",
      {
        email,
        listIds: [8],
        updateEnabled: true   // 🔥 fondamentale
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Iscrizione completata:", response.data);
    return { status: "ok" };

  } catch (err) {
    console.error("❌ Errore iscrizione Brevo:", err.response?.data || err);
    throw err;
  }
}

module.exports = { iscriviEmail };
