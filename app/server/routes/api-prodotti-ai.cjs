// FILE: app/server/routes/api-prodotti-ai.cjs
// PATH ASSOLUTO: app/server/routes/api-prodotti-ai.cjs
// VERSIONE PATCH: Competitor Intelligence 2027.1

const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

/* =========================================================
   REQUIRE ASSOLUTI
========================================================= */
const ROOT = process.cwd();

const db = require(path.join(ROOT, "app/server/db/database.cjs"));
const ai = require(path.join(ROOT, "app/server/modules/ai.cjs"));
const pdfGenerator = require(path.join(ROOT, "app/server/services/pdf-generator.cjs"));
const competitorAI = require(path.join(ROOT, "app/server/modules/ai-competitor-intel.cjs"));

/* =========================================================
   UNIVERSAL JSON HELPERS
========================================================= */
function ok(data) {
  return { success: true, data };
}
function fail(error) {
  return { success: false, error: String(error) };
}

/* =========================================================
   POST /api/ai/searchproduct
   🔥 PATCH: Competitor Intelligence
========================================================= */
router.post("/searchproduct", async (req, res) => {
  try {
    const { query } = req.body;

    /* ---------------------------------------------------------
       1) VALIDAZIONE BASE (già esistente)
    --------------------------------------------------------- */
    const prompt = `
Analizza l'idea di prodotto seguente e restituisci:
- titolo
- categoria
- trend_score (0-1)
- colore (verde/giallo/rosso)
- motivazione
- note_ricerca

Idea: ${query}
`;

    const result = await ai.generateValidation(prompt);

    /* ---------------------------------------------------------
       2) COMPETITOR INTELLIGENCE (nuovo)
    --------------------------------------------------------- */
    const comp = await competitorAI.analizzaCompetitor({
      titolo: result.titolo,
      categoria: result.categoria
    });

    /* ---------------------------------------------------------
       3) SALVATAGGIO COMPLETO IN validazioni
    --------------------------------------------------------- */
    const stmt = await db.prepare(`
      INSERT INTO validazioni (
        titolo, categoria, trend_score, colore, motivazione, note_ricerca,
        percentuale_competitor, punteggio_saturazione, punteggio_opportunita,
        prezzo_consigliato, configurazione_consigliata,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const info = await stmt.run(
      result.titolo,
      result.categoria || "",
      result.trend_score || 0,
      result.colore || "giallo",
      result.motivazione || "",
      result.note_ricerca || "",
      comp.percentuale_competitor || 0,
      comp.punteggio_saturazione || 0,
      comp.punteggio_opportunita || 0,
      comp.prezzo_consigliato || 2900,
      comp.configurazione_consigliata || ""
    );

    return res.json(ok({
      id: info.lastID,
      ...result,
      competitor: comp
    }));

  } catch (err) {
    console.error("❌ searchproduct:", err);
    return res.json(fail(err.message));
  }
});

/* =========================================================
   POST /api/ai/generaImmagine
========================================================= */
router.post("/generaImmagine", async (req, res) => {
  try {
    const { id, titolo, descrizione, categoria } = req.body;

    const prompt = `
Crea una immagine di copertina professionale per un prodotto digitale.

Titolo: ${titolo}
Categoria: ${categoria}
Descrizione: ${descrizione}

Stile:
- moderno, pulito, minimal
- colori coerenti con il tema
- nessun volto reale
- nessun testo
- nessun watermark
- formato quadrato 1024x1024
`;

    const imgBase64 = await ai.generateImage(prompt);

    const filename = `cover_${id}.webp`;
    const dir = path.join(ROOT, "app/public/uploads/prodotti");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, Buffer.from(imgBase64, "base64"));

    return res.json(ok({
      url: `/uploads/prodotti/${filename}`
    }));

  } catch (err) {
    console.error("❌ generaImmagine:", err);
    return res.json(fail(err.message));
  }
});

/* =========================================================
   POST /api/ai/generaFileProdotto
========================================================= */
router.post("/generaFileProdotto", async (req, res) => {
  try {
    const { id, titolo, descrizione, config } = req.body;

    const prompt = `
Genera il contenuto completo del prodotto digitale seguendo questa configurazione:

Tipo: ${config.type}
Numero pagine: ${config.pages}
Livello: ${config.level}
Lingua: ${config.language}
Target: ${config.target}

Titolo: ${titolo}
Descrizione tecnica: ${descrizione}

Il contenuto deve essere:
- strutturato in capitoli
- coerente con la descrizione tecnica
- professionale
- utile e pratico
- senza riferimenti a copyright
- senza contenuti sensibili
`;

    const contenuto = await ai.generateText(prompt);

    const filename = `prodotto_${id}.pdf`;
    const dir = path.join(ROOT, "app/public/uploads/fileProdotti");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filepath = path.join(dir, filename);

    await pdfGenerator(contenuto, filepath);

    return res.json(ok({
      url: `/uploads/fileProdotti/${filename}`
    }));

  } catch (err) {
    console.error("❌ generaFileProdotto:", err);
    return res.json(fail(err.message));
  }
});

/* =========================================================
   POST /api/ai/generateproduct
   🔥 PATCH: usa prezzo consigliato + config consigliata
========================================================= */
router.post("/generateproduct", async (req, res) => {
  try {
    const { validazione_id, config } = req.body;

    const val = await db.get(
      "SELECT * FROM validazioni WHERE id = ?",
      validazione_id
    );

    if (!val) return res.json(fail("Validazione non trovata"));

    /* ---------------------------------------------------------
       DESCRIZIONE TECNICA
    --------------------------------------------------------- */
    const promptDescrizione = `
Genera una descrizione tecnica dettagliata per un prodotto digitale.

Titolo: ${val.titolo}
Categoria: ${val.categoria}
Trend score: ${val.trend_score}
Colore: ${val.colore}
Motivazione: ${val.motivazione}

La descrizione deve essere:
- tecnica ma comprensibile
- orientata alla vendita
- coerente con la validazione
- in lingua ${config.language || "IT"}
`;

    const descrizione_tecnica = await ai.generateText(promptDescrizione);

    /* ---------------------------------------------------------
       PREZZO CONSIGLIATO (competitor intelligence)
    --------------------------------------------------------- */
    const prezzo_cent = val.prezzo_consigliato
      ? Math.round(val.prezzo_consigliato)
      : Math.round((config.price || 49) * 100);

    /* ---------------------------------------------------------
       CONFIGURAZIONE CONSIGLIATA (competitor intelligence)
    --------------------------------------------------------- */
    const configFinale = {
      ...config,
      suggerita: val.configurazione_consigliata || ""
    };

    /* ---------------------------------------------------------
       CREA RECORD IN prodotti_da_creare
    --------------------------------------------------------- */
    const stmt = await db.prepare(`
      INSERT INTO prodotti_da_creare
      (titolo, categoria, descrizione_tecnica, prezzo_cent, config_json, stato, created_at)
      VALUES (?, ?, ?, ?, ?, 'in_generazione', datetime('now'))
    `);

    const info = await stmt.run(
      val.titolo,
      val.categoria || "",
      descrizione_tecnica,
      prezzo_cent,
      JSON.stringify(configFinale)
    );

    const id = info.lastID;

    /* ---------------------------------------------------------
       GENERA IMMAGINE
    --------------------------------------------------------- */
    const imgRes = await fetch("http://localhost:3000/api/ai/generaImmagine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        titolo: val.titolo,
        descrizione: descrizione_tecnica,
        categoria: val.categoria || ""
      })
    }).then(r => r.json());

    const imgUrl = imgRes?.success ? imgRes.data.url : null;

    /* ---------------------------------------------------------
       GENERA FILE PDF
    --------------------------------------------------------- */
    const fileRes = await fetch("http://localhost:3000/api/ai/generaFileProdotto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        titolo: val.titolo,
        descrizione: descrizione_tecnica,
        config: configFinale
      })
    }).then(r => r.json());

    const fileUrl = fileRes?.success ? fileRes.data.url : null;

    /* ---------------------------------------------------------
       UPDATE RECORD
    --------------------------------------------------------- */
    await db.prepare(`
      UPDATE prodotti_da_creare
      SET immagine_url = ?, file_consegna_url = ?, stato = 'generato'
      WHERE id = ?
    `).run(imgUrl, fileUrl, id);

    return res.json(ok({
      id,
      titolo: val.titolo,
      categoria: val.categoria || "",
      descrizione_tecnica,
      prezzo_cent,
      immagine_url: imgUrl,
      file_consegna_url: fileUrl,
      config: configFinale
    }));

  } catch (err) {
    console.error("❌ generateproduct:", err);
    return res.json(fail(err.message));
  }
});

module.exports = router;
