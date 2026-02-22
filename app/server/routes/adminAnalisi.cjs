const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin.cjs");

router.get("/analisi/dati", authAdmin, async (req, res) => {
  res.json({
    success: true,
    stats: {
      conversione: 3.2,
      traffico: 1200,
      ctr: 1.8
    },
    prodotti: [],
    traffico: [],
    utm: []
  });
});

module.exports = router;
