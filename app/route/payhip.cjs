const express = require('express');
const router = express.Router();
const { fetchPayhipCatalog } = require('../services/payhip');

router.get('/sync', async (req, res) => {
  try {
    const result = await fetchPayhipCatalog();
    res.json(result);
  } catch (err) {
    console.error('Errore nella sync Payhip:', err);
    res.status(500).json({ error: 'Errore nella sync Payhip' });
  }
});

module.exports = router;
