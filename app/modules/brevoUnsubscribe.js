const axios = require("axios");

async function disiscriviEmail(email) {
  try {
    await axios.patch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      { emailBlacklisted: true },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📭 Disiscrizione completata su Brevo:", email);
  } catch (err) {
    console.error("❌ Errore disiscrizione Brevo:", err.response?.data || err);
    throw err;
  }
}

module.exports = { disiscriviEmail };
