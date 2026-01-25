// FILE: brevoSubscribe.js

const axios = require("axios");

async function iscriviEmail(email) {
  const apiKey = process.env.BREVO_API_KEY;

  await axios.post(
    "https://api.brevo.com/v3/contacts",
    { email, listIds: [8] },
    { headers: { "api-key": apiKey, "Content-Type": "application/json" } }
  );

  return { status: "ok" };
}

module.exports = { iscriviEmail };
