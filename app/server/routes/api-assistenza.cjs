/* =========================================================
   FILE: app/server/routes/api-assistenza.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Invio richiesta assistenza + AI + FAQ + Email
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const assistAI = R("modules/assistenza-ai.cjs");
const { inviaEmailLista } = R("modules/invia-email-lista.cjs");
const { addToList } = R("modules/liste-brevo.cjs");
const { templateEmailRisposta } = R("modules/email-risposta.cjs");

/* =========================================================
   FUNZIONE PRINCIPALE: assistenzaInvia
========================================================= */
async function assistenzaInvia(req) {
  console.log("[DEBUG assistenza] assistenzaInvia() chiamato");

  try {
    const { email, domanda } = req.body || {};

    if (!email || !domanda) {
      console.log("[DEBUG assistenza] campi mancanti");
      return { success: false, error: "Campi mancanti." };
    }

    // 1) Salva in lista 15
    await addToList(15, email);

    // 2) RICONOSCIMENTO PRODOTTO
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

    // 3) SE NON È PRODOTTO → CERCA IN FAQ.sql
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

    // 4) GENERA RISPOSTA AI
    const rispostaAI = await assistAI.generaRispostaAssistenza({
      domanda,
      faqRecord
    });

    if (!rispostaAI || typeof rispostaAI !== "string") {
      console.log("[DEBUG assistenza] risposta AI non valida");
      return { success: false, error: "Risposta AI non valida" };
    }

    // 5) CREA TICKET
    const ticket = Math.floor(100000 + Math.random() * 900000);

    // 6) TEMPLATE EMAIL PREMIUM
    const htmlEmail = templateEmailRisposta({ rispostaAI });

    if (!htmlEmail || typeof htmlEmail !== "string") {
      console.log("[DEBUG assistenza] template email non valido");
      return { success: false, error: "Template email non valido" };
    }

    // 7) INVIA EMAIL
    await inviaEmailLista({
      email,
      listId: 15,
      subject: `Risposta alla tua richiesta – Ticket n°${ticket}`,
      html: htmlEmail,
      tipo: "assistenza",
      modalita: "normale"
    });

    console.log("[DEBUG assistenza] ticket generato:", ticket);
    return { success: true, ticket };

  } catch (err) {
    console.error("❌ Errore assistenzaInvia:", err);

    return {
      success: false,
      error: "Errore interno. Il nostro team è stato notificato."
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (il frontend chiama /api/assistenza/inviaAssistenza)
========================================================= */
async function inviaAssistenza(req) {
  console.log("[DEBUG assistenza] alias inviaAssistenza() → assistenzaInvia()");
  return assistenzaInvia(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  assistenzaInvia,
  inviaAssistenza
};
