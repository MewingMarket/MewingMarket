// bots/instagram.js
const axios = require("axios");

module.exports = function createInstagramBot({ airtable, products }) {

  const IG_TOKEN = process.env.IG_TOKEN;
  const IG_USER_ID = process.env.IG_USER_ID;

  // 🔹 1. Pubblica immagine + caption
  async function publishImage(caption, imageUrl) {
    try {
      // Step 1: crea media
      const { data } = await axios.post(
        `https://graph.facebook.com/v17.0/${IG_USER_ID}/media`,
        {
          image_url: imageUrl,
          caption,
          access_token: IG_TOKEN
        }
      );

      // Step 2: pubblica media
      await axios.post(
        `https://graph.facebook.com/v17.0/${IG_USER_ID}/media_publish`,
        {
          creation_id: data.id,
          access_token: IG_TOKEN
        }
      );

    } catch (err) {
      console.error("Errore Instagram:", err.response?.data || err);
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

      await publishImage(testo, p.immagine);

      await airtable.update(p.id, { pubblicato_social: true });
    }
  }

  return {
    publishNewProduct
  };
};
