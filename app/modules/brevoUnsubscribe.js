const axios = require("axios");

async function disiscriviEmail(email) {
  const headers = {
    "api-key": process.env.BREVO_API_KEY,
    "Content-Type": "application/json"
  };

  // 1) GET diretto
  try {
    await axios.get(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      { headers }
    );

    await axios.patch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      { emailBlacklisted: true },
      { headers }
    );

    console.log("📭 Disiscrizione via GET:", email);
    return;
  } catch (_) {}

  // 2) POST → crea contatto
  try {
    await axios.post(
      "https://api.brevo.com/v3/contacts",
      { email, emailBlacklisted: true },
      { headers }
    );

    console.log("📭 Contatto creato e disiscritto:", email);
    return;
  } catch (err) {
    if (err.response?.data?.code !== "duplicate_parameter") {
      console.error("❌ POST errore:", err.response?.data || err);
      throw err;
    }
  }

  // 3) SEARCH avanzata
  try {
    const search = await axios.post(
      "https://api.brevo.com/v3/contacts/search",
      {
        filter: {
          email: {
            $contains: email
          }
        }
      },
      { headers }
    );

    const id = search.data?.contacts?.[0]?.id;

    if (id) {
      await axios.patch(
        `https://api.brevo.com/v3/contacts/${id}`,
        { emailBlacklisted: true },
        { headers }
      );

      console.log("📭 Disiscrizione via SEARCH avanzata:", email);
      return;
    }
  } catch (_) {}

  // 4) FALLBACK FINALE → crea contatto forzato
  try {
    await axios.post(
      "https://api.brevo.com/v3/contacts",
      {
        email,
        emailBlacklisted: true,
        updateEnabled: true
      },
      { headers }
    );

    console.log("📭 Disiscrizione forzata:", email);
    return;
  } catch (err) {
    console.error("❌ Errore finale disiscrizione:", err.response?.data || err);
    throw err;
  }
}

module.exports = { disiscriviEmail };
