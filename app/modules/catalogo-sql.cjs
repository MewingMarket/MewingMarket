// =========================================================
// File: app/modules/catalogo-sql.cjs
// Catalogo prodotti — Versione SQL definitiva
// =========================================================

const fs = require("fs");
const path = require("path");
const db = require("./server/db/database.cjs");

// Path categories.json
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const CATEGORIES_PATH = path.join(DATA_DIR, "categories.json");

// =========================================================
// UTILS
// =========================================================
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveCategories(categories) {
  ensureDataDir();
  fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categories, null, 2));
}

function loadCategories() {
  try {
    ensureDataDir();
    if (fs.existsSync(CATEGORIES_PATH)) {
      return JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf8"));
    }
  } catch {}
  return [];
}

// =========================================================
// GENERA SLUG
// =========================================================
function generateSlug(titolo) {
  return String(titolo || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

// =========================================================
// GENERA CATEGORIA AUTOMATICA
// =========================================================
function generateCategory(titolo, descrizione) {
  const categories = loadCategories();

  const text = `${titolo} ${descrizione}`.toLowerCase();

  // match categorie esistenti
  for (const cat of categories) {
    if (text.includes(cat.toLowerCase())) {
      return cat;
    }
  }

  // fallback: prime 2 parole del titolo
  const words = titolo.split(" ");
  const fallback = words.slice(0, 2).join(" ");

  // aggiungi nuova categoria se non esiste
  if (!categories.includes(fallback)) {
    categories.push(fallback);
    categories.sort();
    saveCategories(categories);
  }

  return fallback;
}

// =========================================================
// NORMALIZZA PRODOTTO PER FRONTEND
// =========================================================
function normalizeProduct(row) {
  return {
    id: row.id,
    titolo: row.titolo_breve,
    descrizione: row.descrizione_lunga,
    prezzo: row.prezzo_cent / 100,
    categoria: row.categoria,
    slug: row.slug,
    immagine: row.immagine_url,
    fileProdotto: row.file_consegna_url,
    youtube_url: row.youtube_url,
    youtube_title: row.youtube_title,
    youtube_thumbnail: row.youtube_thumbnail
  };
}

// =========================================================
// GET ALL PRODUCTS
// =========================================================
function getAllProducts() {
  const rows = db.prepare("SELECT * FROM prodotti ORDER BY id DESC").all();
  return rows.map(normalizeProduct);
}

// =========================================================
// GET PRODUCT BY SLUG
// =========================================================
function getProductBySlug(slug) {
  const row = db.prepare("SELECT * FROM prodotti WHERE slug = ?").get(slug);
  return row ? normalizeProduct(row) : null;
}

// =========================================================
// GET PRODUCT BY ID
// =========================================================
function getProductById(id) {
  const row = db.prepare("SELECT * FROM prodotti WHERE id = ?").get(id);
  return row ? normalizeProduct(row) : null;
}

// =========================================================
// SAVE PRODUCT (CREATE OR UPDATE)
// =========================================================
function saveProduct(data) {
  const slug = data.slug || generateSlug(data.titolo);
  const categoria = generateCategory(data.titolo, data.descrizione);

  const existing = db.prepare("SELECT id FROM prodotti WHERE slug = ?").get(slug);

  if (existing) {
    db.prepare(`
      UPDATE prodotti SET
        titolo_breve = ?,
        descrizione_lunga = ?,
        prezzo_cent = ?,
        categoria = ?,
        immagine_url = ?,
        file_consegna_url = ?,
        youtube_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE slug = ?
    `).run(
      data.titolo,
      data.descrizione,
      Math.round(data.prezzo * 100),
      categoria,
      data.immagine,
      data.fileProdotto,
      data.youtube_url,
      slug
    );

    return { id: existing.id };
  }

  const result = db.prepare(`
    INSERT INTO prodotti (
      titolo_breve, slug, prezzo_cent, descrizione_lunga,
      categoria, immagine_url, file_consegna_url, youtube_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.titolo,
    slug,
    Math.round(data.prezzo * 100),
    data.descrizione,
    categoria,
    data.immagine,
    data.fileProdotto,
    data.youtube_url
  );

  return { id: result.lastInsertRowid };
}

// =========================================================
// DELETE PRODUCT
// =========================================================
function deleteProduct(slug) {
  const result = db.prepare("DELETE FROM prodotti WHERE slug = ?").run(slug);
  return result.changes > 0;
}

// =========================================================
// UPDATE YOUTUBE FIELDS
// =========================================================
function updateProductYouTubeFields(id, fields) {
  const stmt = db.prepare(`
    UPDATE prodotti SET
      youtube_url = COALESCE(?, youtube_url),
      youtube_title = COALESCE(?, youtube_title),
      youtube_description = COALESCE(?, youtube_description),
      youtube_thumbnail = COALESCE(?, youtube_thumbnail),
      youtube_last_video_url = COALESCE(?, youtube_last_video_url),
      youtube_last_video_title = COALESCE(?, youtube_last_video_title),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    fields.youtube_url,
    fields.youtube_title,
    fields.youtube_description,
    fields.youtube_thumbnail,
    fields.youtube_last_video_url,
    fields.youtube_last_video_title,
    id
  );
}

module.exports = {
  getAllProducts,
  getProductBySlug,
  getProductById,
  saveProduct,
  deleteProduct,
  updateProductYouTubeFields
};
