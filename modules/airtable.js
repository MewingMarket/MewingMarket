
// modules/airtable.js

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const {
  safeSlug,
  cleanText,
  cleanNumber,
  cleanURL
} = require("./utils");

// Variabili ambiente
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

// Catalogo in memoria
let PRODUCTS = [];

// ---------------------------------------------
// SYNC AIRTABLE (BLINDATO + SANITIZZATO)
// ---------------------------------------------
async function syncAirtable() {
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!data.records) return [];

    const products = data.records.map(record => {
      const f = record.fields;
      return {
        id: record.id,
        titolo: cleanText(f.Titolo, "Titolo mancante"),
        titoloBreve: cleanText(f.TitoloBreve, ""),
        slug: safeSlug(f.Slug),
        prezzo: cleanNumber(f.Prezzo),
        categoria: cleanText(f.Categoria, "Generico"),
        attivo: Boolean(f.Attivo),
        immagine: cleanURL(f.Immagine?.[0]?.url),
        linkPayhip: cleanURL(f.LinkPayhip),
        descrizioneBreve: cleanText(f.DescrizioneBreve, ""),
        descrizioneLunga: cleanText(f.DescrizioneLunga, ""),

        // 🔥 NUOVI CAMPI YOUTUBE + SEO + SOCIAL
        youtube_url: cleanURL(f.youtube_url),
        youtube_title: cleanText(f.youtube_title, ""),
        youtube_description: cleanText(f.youtube_description, ""),
        youtube_thumbnail: cleanURL(f.youtube_thumbnail),
        catalog_video_block: cleanText(f.catalog_video_block, ""),
        meta_description: cleanText(f.meta_description, ""),
        social_caption_full: cleanText(f.social_caption_full, "")
      };
    });

    const activeProducts = products.filter(p => p.attivo);

    fs.writeFileSync(
      path.join(process.cwd(), "data", "products.json"),
      JSON.stringify(activeProducts, null, 2)
    );

    console.log(`products.json aggiornato da Airtable (${activeProducts.length} prodotti attivi)`);

    return activeProducts;

  } catch (err) {
    console.error("Errore sync Airtable:", err);
    return [];
  }
}

// ---------------------------------------------
// CARICAMENTO PRODOTTI DA FILE
// ---------------------------------------------
function loadProducts() {
  try {
    const filePath = path.join(process.cwd(), "data", "products.json");

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]");
    }

    const raw = fs.readFileSync(filePath, "utf8");

    if (!raw.trim()) {
      fs.writeFileSync(filePath, "[]");
      PRODUCTS = [];
      return;
    }

    const all = JSON.parse(raw);
    PRODUCTS = all.filter(p => p.attivo === true);

    console.log("Catalogo aggiornato:", PRODUCTS.length, "prodotti attivi");

  } catch (err) {
    console.error("Errore caricamento products.json", err);
    PRODUCTS = [];
  }
}

// Getter per altri moduli
function getProducts() {
  return PRODUCTS;
}

module.exports = {
  syncAirtable,
  loadProducts,
  getProducts
};
