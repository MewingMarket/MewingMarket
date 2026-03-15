// =========================================================
// File: app/modules/catalogo-sql.cjs
// Catalogo prodotti — Versione SQL definitiva (ID-based)
// =========================================================

const fs = require("fs");
const path = require("path");
const db = require(path.join(__dirname, "../server/db/database.cjs"));

// =========================================================
// UTILS — GENERA TITOLO BREVE E DESCRIZIONE BREVE
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
// NORMALIZZA PRODOTTO PER FRONTEND
// =========================================================
function normalizeProduct(row) {
  return {
    id: row.id,

    titolo: row.titolo,
    titolo_breve: row.titolo_breve,

    descrizione_breve: row.descrizione_breve,
    descrizione_lunga: row.descrizione_lunga,

    prezzo: row.prezzo_cent / 100,

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
// GET ALL PRODUCTS
// =========================================================
function getAllProducts() {
  const rows = db.prepare(`
    SELECT *
    FROM prodotti
    ORDER BY created_at DESC, id DESC
  `).all();

  return rows.map(normalizeProduct);
}

// =========================================================
// GET PRODUCT BY ID
// =========================================================
function getProductById(id) {
  const row = db.prepare(`
    SELECT *
    FROM prodotti
    WHERE id = ?
  `).get(id);

  return row ? normalizeProduct(row) : null;
}

// =========================================================
// SAVE PRODUCT (CREATE OR UPDATE)
// data: { id?, titolo, descrizione_lunga, prezzo, immagine, fileProdotto }
// =========================================================
function saveProduct(data) {
  const titolo = (data.titolo || "").trim();
  const descrizione_lunga = (data.descrizione_lunga || "").trim();
  const prezzoNum = Number(data.prezzo) || 0;
  const prezzo_cent = Math.round(prezzoNum * 100);

  const immagine_url = (data.immagine || "").trim() || null;
  const file_consegna_url = (data.fileProdotto || "").trim() || null;

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
      immagine_url,
      file_consegna_url,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    titolo,
    titolo_breve,
    prezzo_cent,
    descrizione_breve,
    descrizione_lunga,
    immagine_url,
    file_consegna_url,
    now,
    now
  );

  return getProductById(info.lastInsertRowid);
}

// =========================================================
// DELETE PRODUCT (ID)
// =========================================================
function deleteProduct(id) {
  const result = db.prepare(`
    DELETE FROM prodotti
    WHERE id = ?
  `).run(id);

  return result.changes > 0;
}

// =========================================================
// UPDATE YOUTUBE FIELDS (solo youtube.cjs la usa)
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
  saveProduct,
  deleteProduct,
  updateProductYouTubeFields
};
