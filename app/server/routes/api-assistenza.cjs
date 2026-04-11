/**
 * =========================================================
 * ASSISTENZA — Endpoint invio richiesta (PATCH 2026.980)
 * - Usa FAQ.sql
 * - Usa prodotti SQL per consigli prodotto
 * - Nessuna invenzione
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db.cjs")); // PATCH: DB SQL
const assistAI = require(path.join(process.cwd(), "app/server/modules/assistenza-ai.cjs"));
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { addToList } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));

router.post("/invia", async (req, res) => {
  const { email, domanda } = req.body;

  if (!email || !domanda) {
    return res.json({ success: false, error: "Campi mancanti." });
  }

  try {
    // 1) Salva in lista 15 (FAQ)
    await addToList(15, email);

    // ============================================================
    // 2) RICONOSCIMENTO PRODOTTO (consigli prodotto)
    // ============================================================
    let faqRecord = null;

    // Cerca match prodotto per titolo o keywords
    const prodotti = await db.all("SELECT * FROM prodotti");
    const matchProdotto = prodotti.find(p =>
      domanda.toLowerCase().includes((p.titolo || "").toLowerCase())
    );

    if (matchProdotto) {
      // Risposta base derivata dalla descrizione lunga
      faqRecord = {
        categoria: "prodotti",
        domanda: domanda,
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

      // Matching semplice: keywords + similarità minima
      faqRecord = tutteFAQ.find(f =>
        domanda.toLowerCase().includes((f.keywords || "").toLowerCase())
      );

      // Se ancora nulla → fallback neutro
      if (!faqRecord) {
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
    // ============================================================
    const rispostaAI = await assistAI.generaRispostaAssistenza({
      domanda,
      faqRecord
    });

    // ============================================================
    // 5) CREA TICKET
    // ============================================================
    const ticket = Math.floor(100000 + Math.random() * 900000);

    // ============================================================
    // 6) INVIA EMAIL
    // ============================================================
    await inviaEmailLista({
      email,
      listId: 15,
      subject: `Risposta alla tua richiesta – Ticket n°${ticket}`,
      html: rispostaAI,
      tipo: "assistenza",
      modalita: "normale"
    });

    return res.json({ success: true, ticket });

  } catch (err) {
    console.error("Errore assistenza:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
