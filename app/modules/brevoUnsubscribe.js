const axios = require("axios");

async function disiscriviEmail(email) {
  try {
    // 1) Controlla se il contatto esiste
    const check = await axios.get(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    // 2) Se esiste → blacklist
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
    // Se il contatto NON esiste → lo creo già in blacklist
    if (err.response?.status === 404) {
      console.log("ℹ️ Contatto non trovato, lo creo in blacklist:", email);

      await axios.post(
        "https://api.brevo.com/v3/contacts",
        {
          email,
          emailBlacklisted: true
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      return;
    }

    console.error("❌ Errore disiscrizione Brevo:", err.response?.data || err);
    throw err;
  }
}

module.exports = { disiscriviEmail };
