/* =========================================================
   FILE: app/server/routes/prodotti-ai.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE:
   - Generazione descrizioni prodotto (lunga + breve)
   - PATCH 2027.1: descrizione anti‑competitor
========================================================= */

const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const {
  generaDescrizioneLunga,
  generaDescrizioneBreve
} = R("modules/catalogo-ai.cjs");

const competitorAI = R("modules/ai-competitor-intel.cjs");

/* ============================================================
   FUNZIONE PRINCIPALE — generaDescrizioneAI
   🔥 PATCH: descrizione ottimizzata contro i competitor
============================================================ */
async function generaDescrizioneAI(req) {
  console.log("[DEBUG prodotti-ai] generaDescrizioneAI()");

  try {
    const { titolo, contenuto, categoria } = req.body || {};

    if (!titolo) {
      return {
        success: false,
        error: "Titolo mancante"
      };
    }

    /* ---------------------------------------------------------
       1) ANALISI COMPETITOR (nuovo)
    --------------------------------------------------------- */
    const comp = await competitorAI.analizzaCompetitor({
      titolo,
      categoria: categoria || ""
    });

    /* ---------------------------------------------------------
       2) DESCRIZIONE LUNGA (base + anti‑competitor)
    --------------------------------------------------------- */
    const prodotto = {
      titolo,
      contenuto: contenuto || "",
      competitor: comp
    };

    const descrizione_lunga_base = await generaDescrizioneLunga(prodotto);

    const descrizione_lunga = `
<h3>${titolo} — Analisi Avanzata</h3>

<p><strong>Competitor nel mercato:</strong> ${comp.percentuale_competitor}%</p>
<p><strong>Saturazione:</strong> ${comp.punteggio_saturazione}/100</p>
<p><strong>Opportunità:</strong> ${comp.punteggio_opportunita}/100</p>

<p>${descrizione_lunga_base}</p>

<h3>Vantaggi Competitivi</h3>
<p>${comp.configurazione_consigliata || "Configurazione ottimizzata per superare i competitor."}</p>
`;

    /* ---------------------------------------------------------
       3) DESCRIZIONE BREVE
    --------------------------------------------------------- */
    const descrizione_breve = await generaDescrizioneBreve(descrizione_lunga);

    return {
      success: true,
      descrizione_lunga,
      descrizione_breve,
      competitor: comp
    };

  } catch (err) {
    console.error("❌ Errore generaDescrizioneAI:", err);
    return {
      success: false,
      error: "Errore generazione AI"
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function genera(req) {
  console.log("[DEBUG prodotti-ai] alias genera() → generaDescrizioneAI()");
  return generaDescrizioneAI(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  generaDescrizioneAI,
  genera
};
