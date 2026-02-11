// modules/youtube.cjs — YouTube metodo A (slug nel titolo)

const path = require("path");
const fetch = require("node-fetch");
const { stripHTML, safeText } = require("./utils.cjs");
const { updateAirtableRecord, syncAirtable, loadProducts } = require("./airtable.cjs");

function extractSlugFromTitle(title) {
  if (!title) return null;
  const match = title.match(/\[([^\]]+)\]/);
  return match ? match[1].trim().toLowerCase() : null;
}

async function updateFromYouTube(video) {
  try {
    const slug = extractSlugFromTitle(video.title);
    if (!slug) {
      console.log("YouTube: nessuno slug trovato nel titolo:", video.title);
      return;
    }

    const products = require(path.join(__dirname, "..", "data", "products.json"));
    const record = products.find(p => p.slug === slug);

    if (!record || !record.id) {
      console.log("YouTube: prodotto non trovato per slug:", slug);
      return;
    }

    const fields = {
      youtube_url: video.url,
      youtube_title: safeText(video.title),
      youtube_description: safeText(stripHTML(video.description || "")),
      youtube_thumbnail: video.thumbnail
    };

    await updateAirtableRecord(record.id, fields);

    await syncAirtable();
    loadProducts();

    console.log("YouTube aggiornato:", slug);
  } catch (err) {
    console.error("Errore updateFromYouTube:", err);
  }
}

module.exports = {
  updateFromYouTube,
  extractSlugFromTitle
};
