// bots/threads.js
const axios = require("axios");

module.exports = function createThreadsBot({ airtable, products }) {

  const THREADS_TOKEN = process.env.THREADS_TOKEN;
  const THREADS_USER_ID = process.env.THREADS_USER_ID;

  // 🔹 1. Pubblica un post su Threads
  async function publishThread(text) {
    try {
      await axios.post(
        "https://api.threads.net/v1/posts",
        {
          user_id: THREADS_USER_ID,
          text
        },
        {
          headers: { Authorization: `Bearer ${THREADS_TOKEN}` }
        }
      );
    } catch (err) {
      console.error("Errore Threads:", err.response?.data || err);
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

      await publishThread(testo);

      await airtable.update(p.id, { pubblicato_social: true });
    }
  }

  return {
    publishNewProduct
  };
};
