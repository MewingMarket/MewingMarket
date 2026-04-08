// =========================================================
// File: app/modules/catalogo-sql.cjs
// Catalogo prodotti — Versione SQL definitiva (ID-based)
// + CATEGORIE AUTOMATICHE MULTI-CATEGORIA (JSON STRING)
// + Nessun pattern, nessuna lista, nessun fallback
// =========================================================

const path = require("path");

// PATCH: require assoluto
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

// =========================================================
// UTILS: TITOLO BREVE + DESCRIZIONE BREVE
// =========================================================
function makeTitoloBreve(titolo) {
  if (!titolo) return "";
  return titolo.split(" ").slice(0, 6).join(" ");
}

function makeDescrizioneBreve(descrizione) {
  if (!descrizione) return "";
  const t = descrizione.trim();
  return t.length > 160 ? t.slice(0, 160) + "…" : t;
}

// =========================================================
// CATEGORIE AUTOMATICHE — estrazione concetti
// Nessuna lista, nessun pattern, nessun fallback
// =========================================================
function generaCategorieAutomatiche(titolo, descrizione = "") {
  const testo = `${titolo} ${descrizione}`.toLowerCase();

  // 1) Tokenizzazione
  let tokens = testo
    .replace(/[^a-zA-Z0-9àèéìòùç ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // 2) Stopwords italiane
  const stopwords = new Set([
    "il","lo","la","i","gli","le","un","una","uno",
    "per","con","senza","che","dei","delle","degli",
    "del","della","dallo","dai","dalle","dal",
    "di","da","in","su","al","allo","alla","alle","agli",
    "e","ed","ma","o","oppure","anche","come","più",
    "meno","molto","poco","tanto","questo","quello",
    "qui","lì","là","nei","nelle","negli","nel"
  ]);

  tokens = tokens.filter(t => t.length > 2 && !stopwords.has(t));

  if (tokens.length === 0) return ["prodotto"];

  // 3) Frequenza parole
  const freq = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  // 4) Ordina per rilevanza (frequenza + presenza nel titolo)
  const titoloTokens = titolo.toLowerCase().split(/\s+/);

  const scored = Object.entries(freq).map(([word, count]) => {
    const inTitolo = titoloTokens.includes(word) ? 2 : 0;
    return { word, score: count + inTitolo };
  });

  scored.sort((a, b) => b.score - a.score);

  // 5) Scegli dinamicamente 1–3 categorie
  const categorie = scored.slice(0, Math.min(3, scored.length)).map(s => s.word);

  return categorie;
}

// =========================================================
// NORMALIZZAZIONE PRODOTTO
// =========================================================
function normalizeProduct(row) {
  let categorie = [];

  try {
    categorie = JSON.parse(row.categoria || "[]");
    if (!Array.isArray(categorie)) categorie = [];
  } catch {
    categorie = [];
  }

  return {
    id: row.id,

    titolo: row.titolo,
    titolo_breve: row.titolo_breve,

    descrizione_breve: row.descrizione_breve,
    descrizione_lunga: row.descrizione_lunga,

    prezzo_cent: row.prezzo_cent,
    prezzo: row.prezzo_cent / 100,

    categoria: categorie, // ARRAY

    immagine: row.immagine_url,
    fileProdotto: row.file_consegna_url,

    youtube_url: row.youtube_url,
    youtube_title: row.youtube_title,
    youtube_thumbnail: row.youtube_thumbnail,
    youtube_description: row.youtube_description,
    youtube_video_id: row.youtube_video_id,

    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// =========================================================
// GET ALL PRODUCTS — auto-fix categorie mancanti
// =========================================================
function getAllProducts() {
  const rows = db.prepare(`
    SELECT *
    FROM prodotti
    ORDER BY created_at DESC, id DESC
  `).all();

  for (const r of rows) {
    let categorie;

    try {
      categorie = JSON.parse(r.categoria || "[]");
    } catch {
      categorie = [];
    }

    if (!Array.isArray(categorie) || categorie.length === 0) {
      const arr = generaCategorieAutomatiche(r.titolo, r.descrizione_lunga);
      const json = JSON.stringify(arr);
      db.prepare(`UPDATE prodotti SET categoria = ? WHERE id = ?`).run(json, r.id);
      r.categoria = json;
    }
  }

  return rows.map(normalizeProduct);
}

// =========================================================
// GET PRODUCT BY ID — auto-fix categoria mancante
// =========================================================
function getProductById(id) {
  const row = db.prepare(`
    SELECT *
    FROM prodotti
    WHERE id = ?
  `).get(id);

  if (!row) return null;

  let categorie;

  try {
    categorie = JSON.parse(row.categoria || "[]");
  } catch {
    categorie = [];
  }

  if (!Array.isArray(categorie) || categorie.length === 0) {
    const arr = generaCategorieAutomatiche(row.titolo, row.descrizione_lunga);
    const json = JSON.stringify(arr);
    db.prepare(`UPDATE prodotti SET categoria = ? WHERE id = ?`).run(json, id);
    row.categoria = json;
  }

  return normalizeProduct(row);
}

// =========================================================
// GET ALL CATEGORIES — unione di tutte le categorie reali
// =========================================================
function getAllCategories() {
  const rows = db.prepare(`
    SELECT categoria
    FROM prodotti
    WHERE categoria IS NOT NULL AND TRIM(categoria) <> ''
  `).all();

  const set = new Set();

  for (const r of rows) {
    try {
      const arr = JSON.parse(r.categoria);
      if (Array.isArray(arr)) {
        arr.forEach(c => set.add(c));
      }
    } catch {}
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// =========================================================
// SAVE PRODUCT — genera categorie se mancanti
// =========================================================
function saveProduct(data) {
  const titolo = (data.titolo || "").trim();
  const descrizione_lunga = (data.descrizione_lunga || "").trim();
  const prezzoNum = Number(data.prezzo) || 0;
  const prezzo_cent = Math.round(prezzoNum * 100);

  const immagine_url = (data.immagine || "").trim() || null;
  const file_consegna_url = (data.fileProdotto || "").trim() || null;

  // CATEGORIE AUTOMATICHE
  let categorie = data.categoria;

  if (!categorie) {
    const arr = generaCategorieAutomatiche(titolo, descrizione_lunga);
    categorie = JSON.stringify(arr); // JSON minificato
  } else if (Array.isArray(categorie)) {
    categorie = JSON.stringify(categorie);
  }

  if (!titolo || !prezzo_cent) {
    throw new Error("Titolo e prezzo sono obbligatori");
  }

  const titolo_breve = makeTitoloBreve(titolo);
  const descrizione_breve = makeDescrizioneBreve(descrizione_lunga);

  const now = new Date().toISOString();

  // UPDATE
  if (data.id) {
    db.prepare(`
      UPDATE prodotti SET
        titolo = ?,
        titolo_breve = ?,
        prezzo_cent = ?,
        descrizione_breve = ?,
        descrizione_lunga = ?,
        categoria = ?,
        immagine_url = ?,
        file_consegna_url = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      titolo,
      titolo_breve,
      prezzo_cent,
      descrizione_breve,
      descrizione_lunga,
      categorie,
      immagine_url,
      file_consegna_url,
      now,
      data.id
    );

    return getProductById(data.id);
  }

  // CREATE
  const info = db.prepare(`
    INSERT INTO prodotti (
      titolo,
      titolo_breve,
      prezzo_cent,
      descrizione_breve,
      descrizione_lunga,
      categoria,
      immagine_url,
      file_consegna_url,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    titolo,
    titolo_breve,
    prezzo_cent,
    descrizione_breve,
    descrizione_lunga,
    categorie,
    immagine_url,
    file_consegna_url,
    now,
    now
  );

  return getProductById(info.lastInsertRowid);
}

// =========================================================
// DELETE PRODUCT
// =========================================================
function deleteProduct(id) {
  const result = db.prepare(`
    DELETE FROM prodotti
    WHERE id = ?
  `).run(id);

  return result.changes > 0;
}

// =========================================================
// UPDATE YOUTUBE FIELDS
// =========================================================
function updateProductYouTubeFields(id, fields) {
  db.prepare(`
    UPDATE prodotti SET
      youtube_url = COALESCE(?, youtube_url),
      youtube_title = COALESCE(?, youtube_title),
      youtube_description = COALESCE(?, youtube_description),
      youtube_thumbnail = COALESCE(?, youtube_thumbnail),
      youtube_video_id = COALESCE(?, youtube_video_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    fields.youtube_url,
    fields.youtube_title,
    fields.youtube_description,
    fields.youtube_thumbnail,
    fields.youtube_video_id,
    id
  );
}

module.exports = {
  getAllProducts,
  getProductById,
  getAllCategories,
  saveProduct,
  deleteProduct,
  updateProductYouTubeFields
};
