// bots/linkedin.js
const axios = require("axios");

module.exports = function createLinkedinBot({ airtable, products }) {

  const LINKEDIN_TOKEN = process.env.LINKEDIN_TOKEN;
  const LINKEDIN_ORG_ID = process.env.LINKEDIN_ORG_ID;

  // 🔹 1. Pubblica post testuale su LinkedIn
  async function publishPost(text) {
    try {
      await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        {
          author: `urn:li:organization:${LINKEDIN_ORG_ID}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text },
              shareMediaCategory: "NONE"
            }
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        },
        {
          headers: {
            Authorization: `Bearer ${LINKEDIN_TOKEN}`,
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json"
          }
        }
      );

    } catch (err) {
      console.error("Errore LinkedIn:", err.response?.data || err);
    }
  }

  // 🔹 2. Pubblica SOLO i nuovi prodotti
  async function publishNewProduct() {
    const today = new Date().toISOString().split("T")[0];

    const nuovi = products.filter(p =>
      p.data_pubblicazione === today && !p.pubblicato_social
    );

    for (const p of nuovi) {

      const testo = 
`${p.titolo}

${p.descrizioneBreve}

Acquista qui: ${p.linkPayhip}`;

      await publishPost(testo);

      await airtable.update(p.id, { pubblicato_social: true });
    }
  }

  return {
    publishNewProduct
  };
};
