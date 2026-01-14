// bots/facebook.js

const axios = require("axios");

module.exports = function createFacebookBot({ airtable, products }) {

  const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_TOKEN;
  const PAGE_ID = process.env.FB_PAGE_ID;

  // 🔹 1. Pubblica un post sulla pagina Facebook
  async function publishPost(text, imageUrl = null) {
    try {
      if (imageUrl) {
        await axios.post(
          `https://graph.facebook.com/${PAGE_ID}/photos`,
          {
            url: imageUrl,
            caption: text,
            access_token: PAGE_ACCESS_TOKEN
          }
        );
      } else {
        await axios.post(
          `https://graph.facebook.com/${PAGE_ID}/feed`,
          {
            message: text,
            access_token: PAGE_ACCESS_TOKEN
          }
        );
      }
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
      const testo = `${p.titolo}\n\n${p.descrizione}\n\nAcquista qui: ${p.link_payhip}\n\nVideo: ${p.video_youtube}`;
      await publishPost(testo, p.immagine);

      // aggiorna Airtable
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
        risposta = "Ecco il catalogo completo: https://www.mewingmarket.it/catalogo.html";
      }

      if (text.includes("novità")) {
        risposta = "Ecco le novità di oggi: https://www.mewingmarket.it/catalogo.html?categoria=novita";
      }

      if (text.includes("newsletter")) {
        risposta = "Vuoi iscriverti alla newsletter? Scrivi: ISCRIVIMI";
      }

      if (text.includes("iscrivimi")) {
        risposta = "Perfetto! Sei iscritto alla newsletter.";
        // qui puoi aggiungere iscrizione a Brevo
      }

      // invia risposta
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
