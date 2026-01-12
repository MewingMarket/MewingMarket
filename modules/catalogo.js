// modules/catalogo.js

const { getProducts } = require("./airtable");

function getProductBySlug(slug) {
  const products = getProducts();
  return products.find(p => p.slug === slug) || null;
}

function listAllProducts() {
  return getProducts();
}

module.exports = {
  getProductBySlug,
  listAllProducts
};
