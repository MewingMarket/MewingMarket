/**
 * =========================================================
 * File: app/server/api-ordini.cjs
 * API ordini + cashout
 * =========================================================
 */

const {
  getAllOrders,
  updateOrder
} = require("../modules/ordini.cjs");

module.exports = function (app) {

  // Lista ordini
  app.get("/api/ordini", async (req, res) => {
    try {
      const orders = await getAllOrders();
      res.json({ success: true, orders });
    } catch (err) {
      res.status(500).json({ success: false, error: "server_error" });
    }
  });

  // Aggiorna stato ordine (es. pagato)
  app.post("/api/ordini/update", async (req, res) => {
    try {
      const { id, fields } = req.body;
      await updateOrder(id, fields);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: "update_failed" });
    }
  });

};
