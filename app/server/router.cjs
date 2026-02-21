// =========================================================
// File: app/server/router.cjs
// Router principale
// =========================================================

const express = require("express");
const router = express.Router();

// --- API ---
router.use(require("./routes/api-login.cjs"));
router.use(require("./routes/api-reset.cjs"));
router.use(require("./routes/api-prodotti.cjs"));
router.use(require("./routes/api-ordini.cjs"));
router.use(require("./routes/api-vendite.cjs"));
router.use(require("./routes/api-upload.cjs"));

// --- Dashboard login (pagina statica) ---
router.get("/dashboard", (req, res) => {
  res.sendFile("dashboard-login.html", { root: "app/public" });
});

module.exports = router;
