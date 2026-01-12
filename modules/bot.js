// modules/bot.js

const { listAllProducts, getProductBySlug } = require("./catalogo");
const { generateUID } = require("./utils");

const userStates = {};

function reply(res, text) {
  return res.json({ reply: text });
}

function detectIntent(message) {
  const msg = message.toLowerCase();

  if (msg.includes("catalogo")) return { intent: "catalogo" };
  if (msg.includes("prodotto")) return { intent: "prodotto" };
  if (msg.includes("aiuto")) return { intent: "aiuto" };

  return { intent: "menu" };
}

function handleConversation(req, res, intent, sub, message) {
  const uid = req.uid;

  switch (intent) {
    case "catalogo":
      const products = listAllProducts();
      return reply(res, `📦 Prodotti disponibili:\n${products.map(p => "- " + p.nome).join("\n")}`);

    case "prodotto":
      const slug = message.split(" ").pop().trim();
      const product = getProductBySlug(slug);

      if (!product) return reply(res, "❌ Prodotto non trovato.");

      return reply(res, `📘 ${product.nome}\n${product.descrizione}`);

    case "aiuto":
      return reply(res, "Posso mostrarti il catalogo o informazioni sui prodotti.");

    default:
      return reply(res, "Benvenuto! Scrivi *catalogo* per vedere i prodotti.");
  }
}

module.exports = {
  detectIntent,
  handleConversation,
  reply,
  userStates,
  generateUID
};
