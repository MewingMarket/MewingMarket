/**
 * =========================================================
 * ASSISTENZA — Endpoint invio richiesta (PATCH 2027.500)
 * - Usa FAQ.sql
 * - Usa prodotti SQL per consigli prodotto
 * - Usa template email premium
 * - Risposta JSON garantita (no HTML)
 * - Validazione rispostaAI, template, invio email
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs")); // PATCH: DB SQL

const assistAI = require(path.join(process.cwd(), "app/server/modules/assistenza-ai.cjs"));
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { addToList } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));

// PATCH: Template email premium
const { templateEmailRisposta } = require(path.join(
  process.cwd(),
  "app/server/modules/email-risposta.cjs"
));

router.post("/invia", async (req, res) => {
  const { email, domanda } = req.body;

  if (!email || !domanda) {
    return res.status(200).json({ success: false, error: "Campi mancanti." });
  }

  try {
    // 1) Salva in lista 15 (FAQ)
    await addToList(15, email);

    // ============================================================
    // 2) RICONOSCIMENTO PRODOTTO (consigli prodotto)
    // ============================================================
    let faqRecord = null;

    const prodotti = await db.all("SELECT * FROM prodotti");
    const domandaLower = domanda.toLowerCase();

    const matchProdotto = prodotti.find(p =>
      domandaLower.includes((p.titolo || "").toLowerCase())
    );

    if (matchProdotto) {
      faqRecord = {
        categoria: "prodotti",
        domanda,
        risposta_base: matchProdotto.descrizione_lunga || "",
        keywords: matchProdotto.titolo,
        fonte: "prodotti.sql"
      };
    }

    // ============================================================
    // 3) SE NON È UN PRODOTTO → CERCA IN FAQ.sql
    // ============================================================
    if (!faqRecord) {
      const tutteFAQ = await db.all("SELECT * FROM faq");

      const matchFAQ = tutteFAQ.find(f =>
        domandaLower.includes((f.keywords || "").toLowerCase())
      );

      if (matchFAQ) {
        faqRecord = {
          categoria: matchFAQ.categoria || "faq",
          domanda,
          risposta_base: matchFAQ.risposta || "",
          keywords: matchFAQ.keywords || "",
          fonte: "faq.sql"
        };
      } else {
        faqRecord = {
          categoria: "generico",
          domanda,
          risposta_base: "",
          keywords: "",
          fonte: "nessuna"
        };
      }
    }

    // ============================================================
    // 4) GENERA RISPOSTA AI (basata SOLO su risposta_base)
    //    + VALIDAZIONE rispostaAI
    // ============================================================
    const rispostaAI = await assistAI.generaRispostaAssistenza({
      domanda,
      faqRecord
    });

    if (!rispostaAI || typeof rispostaAI !== "string") {
      throw new Error("Risposta AI non valida");
    }

    // ============================================================
    // 5) CREA TICKET
    // ============================================================
    const ticket = Math.floor(100000 + Math.random() * 900000);

    // ============================================================
    // 6) TEMPLATE EMAIL PREMIUM + VALIDAZIONE
    // ============================================================
    const htmlEmail = templateEmailRisposta({ rispostaAI });

    if (!htmlEmail || typeof htmlEmail !== "string") {
      throw new Error("Template email non valido");
    }

    // ============================================================
    // 7) INVIA EMAIL + VALIDAZIONE
    // ============================================================
    await inviaEmailLista({
      email,
      listId: 15,
      subject: `Risposta alla tua richiesta – Ticket n°${ticket}`,
      html: htmlEmail,
      tipo: "assistenza",
      modalita: "normale"
    });

    if (!email) {
      throw new Error("Invio email fallito");
    }

    return res.status(200).json({ success: true, ticket });

  } catch (err) {
    console.error("Errore assistenza:", err);

    // 🔥 PATCH BLINDATA — risposta JSON garantita
    return res.status(200).json({
      success: false,
      error: "Errore interno. Il nostro team è stato notificato."
    });
  }
});

module.exports = router;
