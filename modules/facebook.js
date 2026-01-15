// bots/facebook.js
const axios = require("axios");

module.exports = function createFacebookBot({ airtable, products }) {

  const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_TOKEN;
  const PAGE_ID = process.env.FB_PAGE_ID;

  // 🔹 1. Pubblica un post sulla pagina Facebook
  async function publishPost(text, imageUrl = null) {
    try {
      const url = imageUrl
        ? `https://graph.facebook.com/${PAGE_ID}/photos`
        : `https://graph.facebook.com/${PAGE_ID}/feed`;

      const payload = imageUrl
        ? { url: imageUrl, caption: text, access_token: PAGE_ACCESS_TOKEN }
        : { message: text, access_token: PAGE_ACCESS_TOKEN };

      await axios.post(url, payload);

    } catch (err) {
      console.error("Errore pubblicazione Facebook:", err.response?.data || err);
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

      await publishPost(testo, p.immagine);

      await airtable.update(p.id, { pubblicato_social: true });
    }
  }

  // 🔹 3. Risponde ai messaggi Messenger
  async function handleMessage(body) {
    try {
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];

      if (!messaging || !messaging.message) return;

      const senderId = messaging.sender.id;
      const text = messaging.message.text?.toLowerCase() || "";

      let risposta = "Ciao! Come posso aiutarti?";

      if (text.includes("catalogo")) {
        risposta = "Ecco il catalogo completo:\nhttps://www.mewingmarket.it/catalogo.html";
      }

      if (text.includes("novità")) {
        risposta = "Ecco le novità di oggi:\nhttps://www.mewingmarket.it/catalogo.html?categoria=novita";
      }

      if (text.includes("newsletter")) {
        risposta = "Vuoi iscriverti alla newsletter? Scrivi: ISCRIVIMI";
      }

      if (text.includes("iscrivimi")) {
        risposta = "Perfetto! Sei iscritto alla newsletter.";
        // TODO: integrazione Brevo
      }

      await axios.post(
        `https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        {
          recipient: { id: senderId },
          message: { text: risposta }
        }
      );

    } catch (err) {
      console.error("Errore handleMessage Facebook:", err.response?.data || err);
    }
  }

  return {
    publishNewProduct,
    handleMessage
  };
};
