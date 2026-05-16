// =========================================================
// FILE: app/server/modules/ai-competitor-intel.cjs
// SCOPO: Analisi Competitor Intelligence per validazione prodotti
// VERSIONE: 2027.1 — Java‑mode
// FUNZIONI FORNITE:
// - analizzaCompetitor(titolo, categoria)
//   → % competitor
//   → punteggio saturazione
//   → punteggio opportunità
//   → prezzo consigliato
//   → configurazione consigliata
// =========================================================

const ai = require("./ai.cjs"); // usa il tuo wrapper AI

async function analizzaCompetitor({ titolo, categoria }) {
  try {
    const prompt = `
Analizza il mercato reale per il prodotto:

Titolo: ${titolo}
Categoria: ${categoria}

Restituisci SOLO un JSON con:
{
  "percentuale_competitor": 0-100,
  "punteggio_saturazione": 0-100,
  "punteggio_opportunita": 0-100,
  "prezzo_consigliato": numero,
  "configurazione_consigliata": "testo"
}
`;

    const result = await ai.generateJSON(prompt);

    return {
      success: true,
      ...result
    };

  } catch (err) {
    console.error("❌ ERRORE analizzaCompetitor:", err);
    return {
      success: false,
      percentuale_competitor: 0,
      punteggio_saturazione: 50,
      punteggio_opportunita: 50,
      prezzo_consigliato: 2900,
      configurazione_consigliata: "Standard"
    };
  }
}

module.exports = {
  analizzaCompetitor
};
