/**
 * premium/index.cjs — VERSIONE VIDEOGIOCO 2027
 * Hub centrale per tutti i moduli premium JSON UI.
 * Importa e riesporta tutto in modo ordinato.
 */

const path = require("path");

const Cards = require(path.join(process.cwd(), "app/modules/premium/cards.cjs"));
const Quick = require(path.join(process.cwd(), "app/modules/premium/quickReplies.cjs"));
const Rich = require(path.join(process.cwd(), "app/modules/premium/richMessages.cjs"));
const Post = require(path.join(process.cwd(), "app/modules/premium/postPurchase.cjs"));
const Cross = require(path.join(process.cwd(), "app/modules/premium/crossSell.cjs"));

module.exports = {
  Cards,
  Quick,
  Rich,
  Post,
  Cross
};
