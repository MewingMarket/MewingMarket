/**
 * =========================================================
 * RIMBORSO — Generatore risposta automatica
 * Versione 2026.995 — Basato su risposta_base (categorie)
 * - Nessuna invenzione
 * - Nessuna informazione non presente
 * - Struttura premium coerente con assistenza
 * =========================================================
 */

const path = require("path");
const callAI = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

async function generaRispostaRimborso({ motivo, categoriaRecord }) {
  /**
   * categoriaRecord = {
   *   categoria: "...",
   *   tipo: "risolvibile" | "non_risolvibile",
   *   risposta_base: "...",
   *   keywords: [...]
   * }
   */

  const rispostaBase = categoriaRecord?.risposta_base || "";
  const categoria = categoriaRecord?.categoria || "";
  const tipo = categoriaRecord?.tipo || "";

  const prompt = `
Genera una risposta email professionale per un utente che ha inviato una richiesta di rimborso.

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
2. Risposta diretta al motivo dell’utente.
3. Istruzioni pratiche (solo se presenti nella risposta_base).
4. Link utili (solo se presenti nella risposta_base).
5. Chiusura professionale.

MOTIVO UTENTE:
${motivo}

RISPOSTA_BASE (categoria: ${categoria}, tipo: ${tipo}):
${rispostaBase}

Scrivi in italiano naturale, chiaro e professionale.
`;

  return await callAI({
    userPrompt: prompt,
    extraSystem: "Sei un assistente professionale che risponde ai clienti usando solo la risposta_base fornita.",
    extraData: { motivo, categoria, tipo }
  });
}

module.exports = {
  generaRispostaRimborso
};
