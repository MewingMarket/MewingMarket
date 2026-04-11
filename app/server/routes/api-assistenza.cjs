/**
 * =========================================================
 * ASSISTENZA — Endpoint invio richiesta (PATCH 2026.950)
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Modulo AI
const assistAI = require(path.join(process.cwd(), "app/server/modules/assistenza-ai.cjs"));

// PATCH: Modulo inviaEmailLista
const { inviaEmailLista } = require(path.join(
  process.cwd(),
  "app/server/modules/invia-email-lista.cjs"
));

// PATCH: Modulo liste Brevo
const { addToList } = require(path.join(
  process.cwd(),
  "app/server/modules/liste-brevo.cjs"
));

router.post("/invia", async (req, res) => {
  const { email, domanda } = req.body;

  if (!email || !domanda) {
    return res.json({ success: false, error: "Campi mancanti." });
  }

  try {
    // 1) Salva in lista 15 (FAQ)
    await addToList(15, email);

    // 2) Leggi FAQ + Guide
    const faqHTML = fs.readFileSync(
      path.join(process.cwd(), "app/public/FAQ.html"),
      "utf8"
    );

    const guideHTML = fs.readFileSync(
      path.join(process.cwd(), "app/public/guide.html"),
      "utf8"
    );

    // 3) Genera risposta AI
    const risposta = await assistAI.generaRispostaAssistenza({
      domanda,
      faqHTML,
      guideHTML
    });

    // 4) Invia email tramite inviaEmailLista (FIREWALL + SANDBOX + LIVE)
    await inviaEmailLista({
      email,
      listId: 15,
      subject: "Risposta alla tua richiesta di assistenza",
      html: risposta,
      tipo: "assistenza",
      modalita: "normale"
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Errore assistenza:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
