// modules/youtube.cjs — VERSIONE DEFINITIVA (allineata all’ecosistema)

const path = require("path");
const { stripHTML, safeText, cleanURL } = require("./utils.cjs");
const { updateAirtableRecord, loadProducts } = require("./airtable.cjs");

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
   UPDATE DA YOUTUBE (versione stabile, senza sync interno)
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
    const products = loadProducts();
    const record = products.find(p => p.slug === slug);

    if (!record || !record.id) {
      console.log("YouTube: prodotto non trovato per slug:", slug);
      return;
    }

    /* =====================================================
       PREPARAZIONE CAMPI
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
