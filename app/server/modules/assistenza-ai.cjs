/**
 * =========================================================
 * ASSISTENZA AI — Generatore risposte automatiche
 * Versione 2026.950 — Sistema assistenza unificato (FAQ.sql)
 * - Risposte basate su FAQ.sql (risposta_base)
 * - Nessuna invenzione
 * - Nessuna informazione non presente nelle fonti ufficiali
 * =========================================================
 */

const path = require("path");
const callAI = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

/* ============================================================
   1) GENERA RISPOSTA ASSISTENZA (FAQ.sql → email)
============================================================ */
async function generaRispostaAssistenza({ domanda, faqRecord }) {
  /**
   * faqRecord = {
   *   categoria: "...",
   *   domanda: "...",
   *   risposta_base: "...",
   *   keywords: "...",
   *   fonte: "..."
   * }
   */

  const rispostaBase = faqRecord?.risposta_base || "";
  const categoria = faqRecord?.categoria || "";
  const fonte = faqRecord?.fonte || "";

  const prompt = `
Genera una risposta email professionale per un utente che ha inviato una domanda di assistenza.

OBIETTIVO:
Rispondere in modo chiaro, utile, educato e basato SOLO sulla risposta_base fornita.

ISTRUZIONI:
- Usa SOLO la risposta_base.
- NON inventare nulla.
- NON aggiungere funzionalità non presenti.
- NON usare tono commerciale.
- NON usare frasi generiche da AI.
- NON ripetere concetti.
- NON usare emoji.
- NON includere parti non presenti nelle fonti ufficiali.
- Se la risposta_base è vuota o non pertinente, rispondi:
  “La tua richiesta richiede una verifica manuale. Ti risponderemo entro 24/48 ore.”

STRUTTURA OBBLIGATORIA:
1. Apertura educata.
2. Risposta diretta alla domanda.
3. Istruzioni pratiche (solo se presenti nella risposta_base).
4. Link utili (solo se presenti nella risposta_base).
5. Chiusura professionale.

DOMANDA UTENTE:
${domanda}

RISPOSTA_BASE (da FAQ.sql):
${rispostaBase}

CATEGORIA:
${categoria}

FONTE:
${fonte}

Scrivi in italiano naturale, chiaro e professionale.
`;

  return await callAI({
    userPrompt: prompt,
    extraSystem: "Sei un assistente professionale che risponde ai clienti usando solo la risposta_base fornita.",
    extraData: { domanda, categoria, fonte }
  });
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  generaRispostaAssistenza
};
