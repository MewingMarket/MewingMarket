/**
 * =========================================================
 * RIMBORSO — Crea richiesta
 * Versione 2026.950
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");

const { inviaEmailRimborso } = require(path.join(process.cwd(), "app/server/modules/email-rimborso.cjs"));

router.post("/crea", async (req, res) => {
  const { email, ordine, motivo } = req.body;

  if (!email || !ordine || !motivo) {
    return res.json({ success: false, error: "Campi mancanti." });
  }

  try {
    // LOGICA RISOLVIBILE / NON RISOLVIBILE
    let tipo = "non_risolvibile";
    let guida = "";

    if (motivo.toLowerCase().includes("download")) {
      tipo = "risolvibile";
      guida = "Per risolvere il problema, prova a scaricare il file da un altro browser o dispositivo.";
    }

    // INVIA EMAIL
    await inviaEmailRimborso({
      email,
      tipo,
      guida
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Errore rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
