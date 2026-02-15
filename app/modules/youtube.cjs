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
   UPDATE DA YOUTUBE (match multiplo + fallback)
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

    // --- MATCH MULTIPLO ---
    const matches = products.filter(
      p => p.Slug?.toLowerCase() === slug
    );

    if (!matches.length) {
      console.log("⚠️ [YouTube] Nessun prodotto trovato per slug:", slug);
      return;
    }

    const fields = {
      youtube_url: cleanURL(video.url),
      youtube_title: safeText(video.title),
      youtube_description: safeText(stripHTML(video.description || "")),
      youtube_thumbnail: cleanURL(video.thumbnail || "")
    };

    for (const record of matches) {
      console.log("📡 [YouTube] Aggiorno Airtable per:", record.Slug);
      await updateAirtableRecord(record.id, fields);
    }

    console.log(`✅ [YouTube] Aggiornati ${matches.length} prodotti per slug:`, slug);

  } catch (err) {
    console.error("❌ Errore updateFromYouTube:", err);
  }
}

module.exports = {
  updateFromYouTube,
  extractSlugFromTitle
};
