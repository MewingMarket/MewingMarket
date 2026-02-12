// FILE: brevoSubscribe.js

const axios = require("axios");

/* =========================================================
   ISCRIZIONE EMAIL A BREVO (blindato)
========================================================= */
async function iscriviEmail(email) {
  try {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      console.error("❌ iscriviEmail: BREVO_API_KEY mancante");
      return { status: "error", message: "API key mancante" };
    }

    if (!email || typeof email !== "string") {
      console.error("❌ iscriviEmail: email non valida:", email);
      return { status: "error", message: "Email non valida" };
    }

    console.log("📩 Tentativo iscrizione:", email);

    const payload = {
      email,
      listIds: [8],
      updateEnabled: true // 🔥 fondamentale
    };

    let response;
    try {
      response = await axios.post(
        "https://api.brevo.com/v3/contacts",
        payload,
        {
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json"
          }
        }
      );
    } catch (err) {
      console.error("❌ Errore iscrizione Brevo:", err.response?.data || err.message);
      return { status: "error", message: "Errore iscrizione Brevo" };
    }

    console.log("✅ Iscrizione completata:", response.data);
    return { status: "ok" };

  } catch (err) {
    console.error("❌ Errore iscriviEmail (catch globale):", err.message);
    return { status: "error", message: "Errore interno iscrizione" };
  }
}

module.exports = { iscriviEmail };
