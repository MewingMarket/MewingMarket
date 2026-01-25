const axios = require("axios");

async function disiscriviEmail(email) {
  const apiKey = process.env.BREVO_API_KEY;

  await axios.post(
    "https://api.brevo.com/v3/contacts/removeFromList",
    { emails: [email], listIds: [8] },
    { headers: { "api-key": apiKey, "Content-Type": "application/json" } }
  );

  return { status: "ok" };
}

module.exports = { disiscriviEmail };
