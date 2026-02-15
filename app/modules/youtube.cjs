// modules/youtube.cjs — VERSIONE SENZA SLUG + FALLBACK INTELLIGENTE

const { stripHTML, safeText, cleanURL } = require("./utils.cjs");
const { updateAirtableRecord, loadProducts } = require("./airtable.cjs");

/* =========================================================
   Similarità tra stringhe (Levenshtein)
========================================================= */
function similarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase();
  b = b.toLowerCase();

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
      );
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

/* =========================================================
   Trova prodotti simili al titolo del video
========================================================= */
function findSimilarProducts(videoTitle, products) {
  const results = [];

  for (const p of products) {
    const score = similarity(videoTitle, p.Titolo || "");
    if (score > 0.35) { // soglia minima
      results.push({ product: p, score });
    }
  }

  // Ordina per similarità
  results.sort((a, b) => b.score - a.score);

  return results.map(r => r.product);
}

/* =========================================================
   UPDATE DA YOUTUBE (senza slug)
========================================================= */
async function updateFromYouTube(video) {
  try {
    console.log("🎬 [YouTube] Ricevuto video:", video.title);

    const products = loadProducts();
    let matches = [];

    // 1) Match per slug (se presente)
    const slugMatch = video.title.match(/\[([^\]]+)\]/);
    if (slugMatch) {
      const slug = slugMatch[1].trim().toLowerCase();
      matches = products.filter(p => p.Slug?.toLowerCase() === slug);
    }

    // 2) Se nessun match → similarità titolo
    if (!matches.length) {
      matches = findSimilarProducts(video.title, products);
    }

    // 3) Se ancora nessun match → fallback generico
    const fields = {
      youtube_url: cleanURL(video.url),
      youtube_title: safeText(video.title),
      youtube_description: safeText(stripHTML(video.description || "")),
      youtube_thumbnail: cleanURL(video.thumbnail || "")
    };

    if (!matches.length) {
      console.log("⚠️ [YouTube] Nessun match trovato → aggiorno campo generico");

      // Aggiorna un record speciale (il primo)
      const first = products[0];
      if (first?.id) {
        await updateAirtableRecord(first.id, {
          youtube_last_video_url: fields.youtube_url,
          youtube_last_video_title: fields.youtube_title
        });
      }
      return;
    }

    // 4) Aggiorna tutti i match
    for (const record of matches) {
      console.log("📡 [YouTube] Aggiorno Airtable per:", record.Slug);
      await updateAirtableRecord(record.id, fields);
    }

    console.log(`✅ [YouTube] Aggiornati ${matches.length} prodotti`);

  } catch (err) {
    console.error("❌ Errore updateFromYouTube:", err);
  }
}

module.exports = {
  updateFromYouTube
};
