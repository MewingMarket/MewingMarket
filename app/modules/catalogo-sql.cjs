// =========================================================
// File: app/modules/catalogo-sql.cjs
// Catalogo prodotti — Versione SQL definitiva (ID-based)
// + CATEGORIE AUTOMATICHE MULTI-CATEGORIA (JSON STRING)
// + Supporto completo: immagine_url, file_consegna_url, config_json
// + Require assoluti
// =========================================================

const path = require("path");

// REQUIRE ASSOLUTO
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
  const t = descrizione.replace(/<[^>]*>/g, '').trim();
  return t.length > 160 ? t.slice(0, 160) + "…" : t;
}

// =========================================================
// CATEGORIE AUTOMATICHE — estrazione concetti
// =========================================================
function generaCategorieAutomatiche(titolo, descrizione = "") {
  const testo = `${titolo} ${descrizione}`.toLowerCase();

  let tokens = testo
    .replace(/[^a-zA-Z0-9àèéìòùç ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

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

  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;

  const titoloTokens = titolo.toLowerCase().split(/\s+/);

  const scored = Object.entries(freq).map(([word, count]) => {
    const inTitolo = titoloTokens.includes(word) ? 2 : 0;
    return { word, score: count + inTitolo };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, Math.min(3, scored.length)).map(s => s.word);
}

// =========================================================
// NORMALIZZAZIONE PRODOTTO (Frontend-ready)
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
    titolo_breve: row.titolo_breve || makeTitoloBreve(row.titolo),

    descrizione_breve: row.descrizione_breve || makeDescrizioneBreve(row.descrizione_lunga || ""),
    descrizione_lunga: row.descrizione_lunga,

    prezzo_cent: row.prezzo_cent,
    prezzo: (row.prezzo_cent / 100).toFixed(2),

    categoria: categorie,

    immagine: row.immagine_url,
    immagine_url: row.immagine_url,

    fileProdotto: row.file_consegna_url,
    file_consegna_url: row.file_consegna_url,

    config_json: row.config_json ? JSON.parse(row.config_json) : null,

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
    let currentCat;
    try {
      currentCat = JSON.parse(r.categoria || "[]");
    } catch {
      currentCat = [];
    }

    if (!Array.isArray(currentCat) || currentCat.length === 0) {
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

  let currentCat;
  try {
    currentCat = JSON.parse(row.categoria || "[]");
  } catch {
    currentCat = [];
  }

  if (!Array.isArray(currentCat) || currentCat.length === 0) {
    const arr = generaCategorieAutomatiche(row.titolo, row.descrizione_lunga);
    const json = JSON.stringify(arr);
    db.prepare(`UPDATE prodotti SET categoria = ? WHERE id = ?`).run(json, id);
    row.categoria = json;
  }

  return normalizeProduct(row);
}

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
      if (Array.isArray(arr)) arr.forEach(c => set.add(c));
    } catch {}
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// =========================================================
// SAVE PRODUCT — con supporto file_consegna_url + config_json
// =========================================================
function saveProduct(data) {
  const titolo = (data.titolo || "").trim();
  const descrizione_lunga = (data.descrizione_lunga || "").trim();

  const prezzo_cent = data.prezzo_cent || Math.round((Number(data.prezzo) || 0) * 100);

  const immagine_url = (data.immagine || data.immagine_url || "").trim() || null;
  const file_consegna_url = (data.fileProdotto || data.file_consegna_url || "").trim() || null;

  const config_json = data.config_json
    ? JSON.stringify(data.config_json)
    : (data.config ? JSON.stringify(data.config) : null);

  let categorie = data.categoria;

  if (!categorie || (Array.isArray(categorie) && categorie.length === 0)) {
    const arr = generaCategorieAutomatiche(titolo, descrizione_lunga);
    categorie = JSON.stringify(arr);
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
        config_json = ?, 
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
      config_json,
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
      config_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    titolo,
    titolo_breve,
    prezzo_cent,
    descrizione_breve,
    descrizione_lunga,
    categorie,
    immagine_url,
    file_consegna_url,
    config_json,
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
