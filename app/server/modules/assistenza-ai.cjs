/**
 * =========================================================
 * ASSISTENZA AI — Generatore risposte automatiche
 * Versione 2026.900 — Sistema assistenza unificato
 * - Risposte basate su FAQ + Guide
 * - Nessuna invenzione
 * - Nessuna informazione non presente nel sito
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluto CORRETTO
const callAI = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

/* ============================================================
   1) GENERA RISPOSTA ASSISTENZA (FAQ + GUIDE → email)
============================================================ */
async function generaRispostaAssistenza({ domanda, faqHTML, guideHTML }) {
  const prompt = `
Genera una risposta email professionale per un utente che ha inviato una domanda di assistenza.

OBIETTIVO:
Rispondere in modo chiaro, utile, educato e basato SOLO sulle informazioni presenti in FAQ e Guide.

ISTRUZIONI:
- Usa SOLO il contenuto fornito (FAQ + Guide).
- NON inventare nulla.
- NON aggiungere funzionalità non presenti.
- NON usare tono commerciale.
- NON usare frasi generiche da AI.
- NON ripetere concetti.
- NON usare emoji.
- NON includere parti non presenti nel sito.
- Se la risposta NON è presente nelle FAQ/Guide, rispondi in modo neutro:
  “La tua richiesta richiede una verifica manuale. Ti risponderemo entro 24/48 ore.”

STRUTTURA OBBLIGATORIA:
1. Apertura educata.
2. Risposta diretta alla domanda.
3. Istruzioni pratiche (solo se presenti nelle FAQ/Guide).
4. Link utili (solo se presenti nelle FAQ/Guide).
5. Chiusura professionale.

DOMANDA UTENTE:
${domanda}

CONTENUTO FAQ:
${faqHTML}

CONTENUTO GUIDE:
${guideHTML}

Scrivi in italiano naturale, chiaro e professionale.
`;

  return await callAI({
    userPrompt: prompt,
    extraSystem: "Sei un assistente professionale che risponde alle domande dei clienti usando solo informazioni ufficiali.",
    extraData: { domanda }
  });
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  generaRispostaAssistenza
};
