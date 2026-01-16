// modules/menu.js

const { sendWhatsAppMessage } = require("./whatsapp");
const { getProducts } = require("./airtable");

async function handleMenu(from, text) {
  const msg = (text || "").trim().toLowerCase();

  if (["ciao", "menu", "start"].includes(msg)) {
    return sendWhatsAppMessage(
      from,
      "👋 Benvenuto su *MewingMarket*!\n\n" +
      "Scrivi una parola chiave:\n\n" +
      "📦 *prodotti* — catalogo\n" +
      "📰 *newsletter* — ricevi l’ultima\n" +
      "🎥 *youtube* — video recenti\n" +
      "💳 *payhip* — link diretto\n" +
      "❓ *supporto* — assistenza"
    );
  }

  if (msg === "prodotti") {
    const prodotti = getProducts();
    if (!prodotti.length) {
      return sendWhatsAppMessage(from, "⚠️ Il catalogo è vuoto. Riprova più tardi.");
    }

    const elenco = prodotti.slice(0, 5).map(p => {
      const titolo = p.titoloBreve || p.titolo;
      const prezzo = p.prezzo ? `€${p.prezzo}` : "";
      return `• *${titolo}* ${prezzo}\n${p.linkPayhip}`;
    }).join("\n\n");

    return sendWhatsAppMessage(
      from,
      `📦 *Catalogo prodotti*\n\n${elenco}\n\nScrivi *prodotti* per rivedere il catalogo.`
    );
  }

  if (msg === "newsletter") {
    return sendWhatsAppMessage(
      from,
      "📰 Ultima newsletter:\nhttps://www.mewingmarket.it/newsletter/html"
    );
  }

  if (msg === "youtube") {
    return sendWhatsAppMessage(
      from,
      "🎥 Video recenti:\nhttps://www.youtube.com/@MewingMarket"
    );
  }

  if (msg === "payhip") {
    return sendWhatsAppMessage(
      from,
      "💳 Catalogo Payhip:\nhttps://payhip.com/MewingMarket"
    );
  }

  if (msg === "supporto") {
    return sendWhatsAppMessage(
      from,
      "❓ Hai bisogno di aiuto?\nScrivici qui o visita:\nhttps://www.mewingmarket.it/supporto"
    );
  }

  return sendWhatsAppMessage(
    from,
    "🤖 Non ho capito.\nScrivi *menu* per vedere le opzioni disponibili."
  );
}

module.exports = {
  handleMenu
};
