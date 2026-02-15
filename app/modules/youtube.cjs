// modules/youtube.cjs — VERSIONE DEFINITIVA

const { stripHTML, safeText, cleanURL } = require("./utils.cjs");
const { updateAirtableRecord, loadProducts } = require("./airtable.cjs");

/* =========================================================
   SLUG DAL TITOLO (es: "Come fare X [houek]")
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
   UPDATE DA YOUTUBE
========================================================= */
async function updateFromYouTube(video) {
  try {
    if (!video || typeof video !== "object") {
      console.error("YouTube: video non valido:", video);
      return;
    }

    console.log("🎬 [YouTube] Ricevuto video:", video.title);

    const slug = extractSlugFromTitle(video.title);
    if (!slug) {
      console.log("⚠️ [YouTube] Nessuno slug trovato nel titolo:", video.title);
      return;
    }

    const products = loadProducts();
    const record = products.find(p => p.Slug?.toLowerCase() === slug);

    if (!record || !record.id) {
      console.log("⚠️ [YouTube] Prodotto non trovato per slug:", slug);
      return;
    }

    const fields = {
      youtube_url: cleanURL(video.url),
      youtube_title: safeText(video.title),
      youtube_description: safeText(stripHTML(video.description || "")),
      youtube_thumbnail: cleanURL(video.thumbnail)
    };

    console.log("📡 [YouTube] Aggiorno Airtable per:", slug);

    await updateAirtableRecord(record.id, fields);

    console.log("✅ [YouTube] Aggiornato:", slug);

  } catch (err) {
    console.error("❌ Errore updateFromYouTube:", err);
  }
}

module.exports = {
  updateFromYouTube,
  extractSlugFromTitle
};
