// modules/youtube.cjs — YouTube metodo A (slug nel titolo) — VERSIONE BLINDATA

const path = require("path");
const fetch = require("node-fetch");
const { stripHTML, safeText, cleanURL } = require("./utils.cjs");
const { updateAirtableRecord, syncAirtable, loadProducts } = require("./airtable.cjs");

/* =========================================================
   SLUG DAL TITOLO (blindato)
========================================================= */
function extractSlugFromTitle(title) {
  try {
    if (!title) return null;
    const match = title.match(/\[([^\]]+)\]/);
    return match ? match[1].trim().toLowerCase() : null;
  } catch (err) {
    console.error("extractSlugFromTitle error:", err);
    return null;
  }
}

/* =========================================================
   UPDATE DA YOUTUBE (blindato)
========================================================= */
async function updateFromYouTube(video) {
  try {
    if (!video || typeof video !== "object") {
      console.error("YouTube: video non valido:", video);
      return;
    }

    const slug = extractSlugFromTitle(video.title);
    if (!slug) {
      console.log("YouTube: nessuno slug trovato nel titolo:", video.title);
      return;
    }

    /* =====================================================
       CARICAMENTO CATALOGO SICURO
    ====================================================== */
    let products = [];
    try {
      products = require(path.join(__dirname, "..", "data", "products.json"));
      if (!Array.isArray(products)) products = [];
    } catch (err) {
      console.error("YouTube: errore lettura products.json:", err);
      products = [];
    }

    const record = products.find(p => p.slug === slug);

    if (!record || !record.id) {
      console.log("YouTube: prodotto non trovato per slug:", slug);
      return;
    }

    /* =====================================================
       PREPARAZIONE CAMPI (blindata)
    ====================================================== */
    const fields = {
      youtube_url: cleanURL(video.url),
      youtube_title: safeText(video.title),
      youtube_description: safeText(stripHTML(video.description || "")),
      youtube_thumbnail: cleanURL(video.thumbnail)
    };

    /* =====================================================
       UPDATE SU AIRTABLE
    ====================================================== */
    await updateAirtableRecord(record.id, fields);

    /* =====================================================
       SYNC + RICARICA CATALOGO
    ====================================================== */
    await syncAirtable();
    loadProducts();

    console.log("YouTube aggiornato:", slug);

  } catch (err) {
    console.error("❌ Errore updateFromYouTube:", err);
  }
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  updateFromYouTube,
  extractSlugFromTitle
};
