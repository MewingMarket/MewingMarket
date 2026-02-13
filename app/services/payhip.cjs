const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fetchPayhipCatalog() {
  const apiKey = process.env.PAYHIP_API_KEY;
  const url = `https://payhip.com/api/v1/products?api_key=${apiKey}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    console.error('Errore fetchPayhipCatalog:', err.response?.data || err);
    throw err;
  }
}

module.exports = { fetchPayhipCatalog };
