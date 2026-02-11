const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const {
  safeSlug,
  cleanText,
  cleanNumber,
  cleanURL,
  stripHTML,
  safeText,
  shorten
} = require(path.join(__dirname, "utils.cjs"));

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE;

let PRODUCTS = [];
let PAYHIP_CACHE = {};

const PRODUCTS_PATH = path.join(__dirname, "..", "data", "products.json");

function safeReadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function mergeProduct(airtable, payhip) {
  if (!payhip) return airtable;
  return {
    ...airtable,
    prezzo: payhip.price ?? airtable.prezzo,
    titolo: payhip.title ?? airtable.titolo,
    immagine: payhip.image ?? airtable.immagine,
    linkPayhip: payhip.url ?? airtable.linkPayhip
  };
}

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
        youtube_url: cleanURL(f.youtube_url),
        youtube_title: cleanText(f.youtube_title, ""),
        youtube_description: cleanText(f.youtube_description, ""),
        youtube_thumbnail: cleanURL(f.youtube_thumbnail),
        catalog_video_block: cleanText(f.catalog_video_block, ""),
        meta_description: cleanText(f.meta_description, ""),
        social_caption_full: cleanText(f.social_caption_full, "")
      };
    });

    const active = products.filter(p => p.attivo);
    const merged = active.map(p => mergeProduct(p, PAYHIP_CACHE[p.slug]));

    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(merged, null, 2));
    console.log(`products.json aggiornato da Airtable (${merged.length} prodotti)`);

    return merged;
  } catch (err) {
    console.error("Errore sync Airtable:", err);
    return safeReadJSON(PRODUCTS_PATH);
  }
}

async function updateAirtableRecord(id, fields) {
  try {
    if (!id) return;
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`;
    await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields })
    });
    console.log("Airtable aggiornato:", id, Object.keys(fields));
  } catch (err) {
    console.error("Errore updateAirtableRecord:", err);
  }
}

async function callAI(prompt) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: "Sei un assistente editoriale. Rispondi solo con il testo richiesto, senza emoji." },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await res.json();
    return safeText(json?.choices?.[0]?.message?.content || "");
  } catch {
    return "";
  }
}

async function generateProductAI({ title, description }) {
  const titolo = safeText(title || "");
  const descr = safeText(description || "");

  const titoloBreve = await callAI(`
Genera un titolo breve (max 6 parole), chiaro, moderno, senza emoji.
Titolo: "${titolo}"
Descrizione: "${descr}"
  `);

  const categoria = await callAI(`
Genera una categoria sintetica (1 o 2 parole), chiara, moderna, senza emoji.
Titolo: "${titolo}"
Descrizione: "${descr}"
  `);

  const descrizioneBreve = await callAI(`
Genera una descrizione breve (max 160 caratteri), chiara, moderna, orientata al beneficio, senza emoji.
Titolo: "${titolo}"
Descrizione: "${descr}"
  `);

  return {
    titoloBreve: shorten(titoloBreve, 60),
    categoria: shorten(categoria, 30),
    descrizioneBreve: shorten(descrizioneBreve, 160)
  };
}

async function updateFromPayhip(data) {
  try {
    const slug = safeSlug(data.slug);
    if (!slug) return;

    const current = safeReadJSON(PRODUCTS_PATH);
    const record = current.find(p => p.slug === slug);

    const descrPulita = safeText(stripHTML(data.description || ""));

    let ai = { titoloBreve: "", categoria: "", descrizioneBreve: "" };
    if (data.title || descrPulita) {
      ai = await generateProductAI({
        title: data.title || (record ? record.titolo : ""),
        description: descrPulita || (record ? record.descrizioneLunga : "")
      });
    }

    if (record && record.id) {
      const fields = {};
      if (data.title) fields.Titolo = data.title;
      if (ai.titoloBreve) fields.TitoloBreve = ai.titoloBreve;
      if (ai.categoria) fields.Categoria = ai.categoria;
      if (ai.descrizioneBreve) fields.DescrizioneBreve = ai.descrizioneBreve;
      if (descrPulita) fields.DescrizioneLunga = descrPulita;
      if (data.price != null) fields.Prezzo = data.price;
      if (data.url) fields.LinkPayhip = data.url;
      if (data.image) fields.Immagine = [{ url: data.image }];
      await updateAirtableRecord(record.id, fields);
    }

    PAYHIP_CACHE[slug] = {
      price: data.price,
      title: data.title,
      image: data.image,
      url: data.url
    };

    await syncAirtable();
    loadProducts();

    console.log("Catalogo aggiornato da Payhip + AI:", slug);
  } catch (err) {
    console.error("Errore updateFromPayhip:", err);
  }
}

function loadProducts() {
  PRODUCTS = safeReadJSON(PRODUCTS_PATH);
  console.log("Catalogo caricato:", PRODUCTS.length, "prodotti");
}

function getProducts() {
  return PRODUCTS;
}

module.exports = {
  syncAirtable,
  loadProducts,
  getProducts,
  updateFromPayhip,
  updateAirtableRecord
};
