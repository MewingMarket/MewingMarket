/* =========================================================
   FILE: app/server/routes/api-assistenza.cjs
   VERSIONE: 2027.3 — PATCH STABILE
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
   UTILS
========================================================= */
function safe(v, fallback = "") {
  return v === undefined || v === null ? fallback : v;
}

/* =========================================================
   FUNZIONE PRINCIPALE: assistenzaInvia
========================================================= */
async function assistenzaInvia(req) {
  console.log("[DEBUG assistenza] assistenzaInvia()");

  try {
    const { email, domanda } = req.body || {};

    if (!email || !domanda) {
      return { success: false, error: "Campi mancanti." };
    }

    /* ---------------------------------------------------------
       1) Salva email in lista 15
    --------------------------------------------------------- */
    try {
      await addToList(15, email);
    } catch (err) {
      console.warn("⚠️ addToList fallito:", err.message);
    }

    /* ---------------------------------------------------------
       2) RICONOSCIMENTO PRODOTTO
       db.all() nel tuo progetto è SINCRONO → rimosso await
    --------------------------------------------------------- */
    let faqRecord = null;

    let prodotti = [];
    try {
      prodotti = db.all("SELECT * FROM prodotti");
    } catch (err) {
      console.warn("⚠️ Errore lettura prodotti:", err.message);
      prodotti = [];
    }

    const domandaLower = domanda.toLowerCase();

    const matchProdotto = prodotti.find(p =>
      domandaLower.includes((p.titolo || "").toLowerCase())
    );

    if (matchProdotto) {
      faqRecord = {
        categoria: "prodotti",
        domanda,
        risposta_base: safe(matchProdotto.descrizione_lunga),
        keywords: matchProdotto.titolo,
        fonte: "prodotti.sql"
      };
    }

    /* ---------------------------------------------------------
       3) SE NON È PRODOTTO → CERCA IN FAQ
    --------------------------------------------------------- */
    if (!faqRecord) {
      let tutteFAQ = [];
      try {
        tutteFAQ = db.all("SELECT * FROM faq");
      } catch (err) {
        console.warn("⚠️ Errore lettura FAQ:", err.message);
        tutteFAQ = [];
      }

      const matchFAQ = tutteFAQ.find(f =>
        domandaLower.includes((f.keywords || "").toLowerCase())
      );

      if (matchFAQ) {
        faqRecord = {
          categoria: matchFAQ.categoria || "faq",
          domanda,
          risposta_base: safe(matchFAQ.risposta),
          keywords: safe(matchFAQ.keywords),
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

    /* ---------------------------------------------------------
       4) GENERA RISPOSTA AI
    --------------------------------------------------------- */
    let rispostaAI = "";
    try {
      rispostaAI = await assistAI.generaRispostaAssistenza({
        domanda,
        faqRecord
      });
    } catch (err) {
      console.error("❌ Errore assistAI:", err);
      rispostaAI = "";
    }

    if (!rispostaAI || typeof rispostaAI !== "string") {
      return { success: false, error: "Risposta AI non valida" };
    }

    /* ---------------------------------------------------------
       5) CREA TICKET
    --------------------------------------------------------- */
    const ticket = Math.floor(100000 + Math.random() * 900000);

    /* ---------------------------------------------------------
       6) TEMPLATE EMAIL
    --------------------------------------------------------- */
    const htmlEmail = templateEmailRisposta({ rispostaAI });

    if (!htmlEmail || typeof htmlEmail !== "string") {
      return { success: false, error: "Template email non valido" };
    }

    /* ---------------------------------------------------------
       7) INVIA EMAIL
    --------------------------------------------------------- */
    try {
      await inviaEmailLista({
        email,
        listId: 15,
        subject: `Risposta alla tua richiesta – Ticket n°${ticket}`,
        html: htmlEmail,
        tipo: "assistenza",
        modalita: "normale"
      });
    } catch (err) {
      console.error("❌ Errore invio email:", err);
      return { success: false, error: "Errore invio email" };
    }

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
========================================================= */
async function inviaAssistenza(req) {
  return assistenzaInvia(req);
}

async function assistenza(req) {
  return { success: true, message: "Endpoint assistenza attivo" };
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  assistenzaInvia,
  inviaAssistenza,
  assistenza
};
