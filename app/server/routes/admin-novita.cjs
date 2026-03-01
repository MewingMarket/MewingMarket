// app/server/routes/admin-novita.cjs
const { inviaNovitaATutti } = require("../scripts/invia-novita.cjs");

module.exports = function(app) {
  app.post("/admin/invia-novita", async (req, res) => {
    try {
      await inviaNovitaATutti();
      res.json({ success: true });
    } catch (err) {
      console.error("Errore invio novità:", err);
      res.json({ success: false });
    }
  });
};
