/**
 * =========================================================
 * RIMBORSO — Procedi al rimborso (solo backend)
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const db = require(path.join(process.cwd(), "app/server/modules/db.cjs"));

router.post("/procedi/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await db.updateOrdine(id, { stato: "rimborsato" });

    return res.json({ success: true });

  } catch (err) {
    console.error("Errore procedi rimborso:", err);
    return res.json({ success: false });
  }
});

module.exports = router;
