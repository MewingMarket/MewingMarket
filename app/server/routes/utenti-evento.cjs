const express = require("express");
const router = express.Router();

router.post("/evento", (req, res) => {
  res.json({
    success: true,
    evento: req.body || null,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
