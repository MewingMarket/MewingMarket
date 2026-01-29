const axios = require("axios");

async function disiscriviEmail(email) {
  const headers = {
    "api-key": process.env.BREVO_API_KEY,
    "Content-Type": "application/json"
  };

  try {
    // 1) GET diretto
    await axios.get(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      { headers }
    );

    // Se GET funziona → blacklist
    await axios.patch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      { emailBlacklisted: true },
      { headers }
    );

    console.log("📭 Disiscrizione completata via GET:", email);
    return;

  } catch (err) {
    // Se GET fallisce → continua
  }

  try {
    // 2) POST → crea contatto in blacklist
    await axios.post(
      "https://api.brevo.com/v3/contacts",
      { email, emailBlacklisted: true },
      { headers }
    );

    console.log("📭 Contatto creato e disiscritto:", email);
    return;

  } catch (err) {
    if (err.response?.data?.code !== "duplicate_parameter") {
      console.error("❌ Errore POST:", err.response?.data || err);
      throw err;
    }
  }

  try {
    // 3) SEARCH → trova ID nascosto
    const search = await axios.post(
      "https://api.brevo.com/v3/contacts/search",
      { email },
      { headers }
    );

    const id = search.data?.contacts?.[0]?.id;

    if (id) {
      await axios.patch(
        `https://api.brevo.com/v3/contacts/${id}`,
        { emailBlacklisted: true },
        { headers }
      );

      console.log("📭 Disiscrizione completata via SEARCH ID:", email);
      return;
    }

  } catch (err) {
    // Se SEARCH fallisce → continua
  }

  // 4) Ultimo fallback → forza PATCH via email
  try {
    await axios.patch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      { emailBlacklisted: true },
      { headers }
    );

    console.log("📭 Disiscrizione forzata via PATCH email:", email);
    return;

  } catch (err) {
    console.error("❌ Errore finale disiscrizione:", err.response?.data || err);
    throw err;
  }
}

module.exports = { disiscriviEmail };
