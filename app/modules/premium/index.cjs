/**
 * premium/index.cjs
 * Hub centrale per tutti i moduli premium.
 * Importa e riesporta tutto in modo ordinato.
 */

const Cards = require("./cards.cjs");
const Quick = require("./quickReplies.cjs");
const Rich = require("./richMessages.cjs");
const Post = require("./postPurchase.cjs");
const Cross = require("./crossSell.cjs");

module.exports = {
  Cards,
  Quick,
  Rich,
  Post,
  Cross
};
