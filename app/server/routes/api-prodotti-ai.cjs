// FILE: app/server/routes/api-prodotti-ai.cjs

const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const db = require("../db.cjs");          // adatta se il tuo db è altrove
const ai = require("../services/ai.cjs"); // wrapper tuo modello AI
const pdfGenerator = require("../services/pdf-generator.cjs"); // generatore PDF custom

/* =========================================================
   HELPER UNIVERSAL-JSON
========================================================= */
function ok(data) {
  return { success: true, data };
}
function fail(error) {
  return { success: false, error: String(error) };
}

/* =========================================================
   POST /api/ai/searchproduct
   - crea una validazione in tabella `validazioni`
========================================================= */
router.post("/searchproduct", async (req, res) => {
  try {
    const { query } = req.body;

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

    const stmt = await db.prepare(`
      INSERT INTO validazioni (titolo, categoria, trend_score, colore, motivazione, note_ricerca, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const info = await stmt.run(
      result.titolo,
      result.categoria || "",
      result.trend_score || 0,
      result.colore || "giallo",
      result.motivazione || "",
      result.note_ricerca || ""
    );

    const id = info.lastID;

    return res.json(ok({
      id,
      titolo: result.titolo,
      categoria: result.categoria || "",
      trend_score: result.trend_score || 0,
      colore: result.colore || "giallo",
      motivazione: result.motivazione || "",
      note_ricerca: result.note_ricerca || ""
    }));
  } catch (err) {
    console.error("❌ searchproduct:", err);
    return res.json(fail(err.message));
  }
});

/* =========================================================
   POST /api/ai/generaImmagine
   - genera immagine di copertina coerente
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
    const dir = path.join(process.cwd(), "app/public/uploads/prodotti");
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
   - genera file di consegna (PDF) rispettando config
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
    const dir = path.join(process.cwd(), "app/public/uploads/fileProdotti");
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
   - usa validazione + config per creare prodotti_da_creare
   - genera descrizione tecnica, immagine, file consegna
========================================================= */
router.post("/generateproduct", async (req, res) => {
  try {
    const { validazione_id, config } = req.body;

    const val = await db.get(
      "SELECT * FROM validazioni WHERE id = ?",
      validazione_id
    );

    if (!val) {
      return res.json(fail("Validazione non trovata"));
    }

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

    const prezzo_cent = Math.round((config.price || 49) * 100);

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
      JSON.stringify(config || {})
    );

    const id = info.lastID;

    // IMMAGINE
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

    // FILE
    const fileRes = await fetch("http://localhost:3000/api/ai/generaFileProdotto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        titolo: val.titolo,
        descrizione: descrizione_tecnica,
        config
      })
    }).then(r => r.json());

    const fileUrl = fileRes?.success ? fileRes.data.url : null;

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
      config
    }));
  } catch (err) {
    console.error("❌ generateproduct:", err);
    return res.json(fail(err.message));
  }
});

module.exports = router;
