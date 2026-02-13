/* =========================================================
   IMPORT BASE
========================================================= */
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

/* =========================================================
   VARIABILI AMBIENTE
========================================================= */
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE;

if (!AIRTABLE_PAT || !BASE_ID || !TABLE_NAME) {
  console.error("❌ Airtable non è configurato correttamente: variabili ambiente mancanti.");
}

/* =========================================================
   CACHE INTERNA
========================================================= */
let PRODUCTS = [];
let PAYHIP_CACHE = {};

const PRODUCTS_PATH = path.join(__dirname, "..", "data", "products.json");

/* =========================================================
   LETTURA JSON SICURA
========================================================= */
function safeReadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn("safeReadJSON: il file non esiste, verrà restituito un array vuoto:", filePath);
      return [];
    }

    const raw = fs.readFileSync(filePath, "utf8");

    if (!raw.trim()) {
      console.warn("safeReadJSON: il file è vuoto, verrà restituito un array vuoto:", filePath);
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.warn("safeReadJSON: il contenuto JSON non è un array, verrà restituito un array vuoto:", filePath);
      return [];
    }

    return parsed;
  } catch (err) {
    console.error("❌ safeReadJSON ha riscontrato un errore:", err?.message || err);
    return [];
  }
}

/* =========================================================
   MERGE PRODOTTO (Airtable + Payhip)
========================================================= */
function mergeProduct(airtable, payhip) {
  try {
    if (!airtable) return null;
    if (!payhip) return airtable;

    return {
      ...airtable,
      prezzo: payhip.price ?? airtable.prezzo,
      titolo: payhip.title ?? airtable.titolo,
      immagine: payhip.image ?? airtable.immagine,
      linkPayhip: payhip.url ?? airtable.linkPayhip
    };
  } catch (err) {
    console.error("❌ Errore durante il merge del prodotto Airtable + Payhip:", err);
    return airtable;
  }
}

/* =========================================================
   SYNC AIRTABLE → products.json (blindato)
========================================================= */
async function syncAirtable() {
  try {
    if (!AIRTABLE_PAT || !BASE_ID || !TABLE_NAME) {
      console.error("❌ syncAirtable: variabili ambiente mancanti. Verrà usata la cache locale.");
      const cached = safeReadJSON(PRODUCTS_PATH);
      console.log(`Airtable non è configurato. Sono stati caricati ${cached.length} prodotti dalla cache locale.`);
      return cached;
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    }).catch(err => {
      console.error("❌ syncAirtable: errore durante la richiesta ad Airtable:", err);
      return null;
    });

    if (!response) {
      console.error("❌ syncAirtable: nessuna risposta da Airtable. Verrà usata la cache locale.");
      const cached = safeReadJSON(PRODUCTS_PATH);
      console.log(`Sono stati caricati ${cached.length} prodotti dalla cache locale.`);
      return cached;
    }

    const data = await response.json().catch(err => {
      console.error("❌ syncAirtable: errore durante il parsing della risposta JSON:", err);
      return null;
    });

    if (!data || !Array.isArray(data.records)) {
      console.error("❌ syncAirtable: records mancanti o non validi. Verrà usata la cache locale.");
      const cached = safeReadJSON(PRODUCTS_PATH);
      console.log(`Sono stati caricati ${cached.length} prodotti dalla cache locale.`);
      return cached;
    }

    const products = data.records
      .map(record => {
        try {
          const f = record.fields || {};

          return {
            id: record.id || null,
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
        } catch (err) {
          console.error("❌ Errore durante il parsing di un record Airtable:", err);
          return null;
        }
      })
      .filter(Boolean);

    const active = products.filter(p => p.attivo && p.slug);

    const merged = active.map(p => mergeProduct(p, PAYHIP_CACHE[p.slug]));

    try {
      fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(merged, null, 2));
      console.log(`Airtable è stato sincronizzato correttamente: ${merged.length} prodotti attivi salvati in products.json.`);
    } catch (err) {
      console.error("❌ Errore durante la scrittura di products.json:", err);
    }

    return merged;
  } catch (err) {
    console.error("❌ Errore generale in syncAirtable:", err);
    const cached = safeReadJSON(PRODUCTS_PATH);
    console.log(`Airtable ha avuto un errore. Sono stati caricati ${cached.length} prodotti dalla cache locale.`);
    return cached;
  }
}

/* =========================================================
   UPDATE RECORD AIRTABLE (blindato)
========================================================= */
async function updateAirtableRecord(id, fields) {
  try {
    if (!id || typeof id !== "string") {
      console.error("❌ updateAirtableRecord: ID non valido:", id);
      return;
    }

    if (!fields || typeof fields !== "object") {
      console.error("❌ updateAirtableRecord: fields non validi:", fields);
      return;
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields })
    }).catch(err => {
      console.error("❌ updateAirtableRecord: errore durante la richiesta PATCH:", err);
      return null;
    });

    if (!res) return;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("❌ updateAirtableRecord: risposta non OK da Airtable:", text);
      return;
    }

    console.log("Airtable è stato aggiornato per il record:", id, "con i campi:", Object.keys(fields));
  } catch (err) {
    console.error("❌ Errore generale in updateAirtableRecord:", err);
  }
}

/* =========================================================
   SALVA VENDITA SU AIRTABLE (blindato)
========================================================= */
async function saveSaleToAirtable(fields) {
  try {
    if (!fields || typeof fields !== "object") {
      console.error("❌ saveSaleToAirtable: fields non validi:", fields);
      return;
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/Vendite`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields })
    }).catch(err => {
      console.error("❌ saveSaleToAirtable: errore durante la richiesta POST:", err);
      return null;
    });

    if (!res) return;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("❌ saveSaleToAirtable: risposta non OK da Airtable:", text);
      return;
    }

    console.log("La vendita è stata salvata correttamente su Airtable:", fields);
  } catch (err) {
    console.error("❌ Errore generale in saveSaleToAirtable:", err);
  }
}

/* =========================================================
   CHIAMATA AI (blindato)
========================================================= */
async function callAI(prompt) {
  try {
    if (!prompt || typeof prompt !== "string") return "";

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
    }).catch(err => {
      console.error("❌ callAI: errore durante la richiesta al modello AI:", err);
      return null;
    });

    if (!res) return "";

    const json = await res.json().catch(err => {
      console.error("❌ callAI: errore durante il parsing della risposta JSON:", err);
      return null;
    });

    const output = json?.choices?.[0]?.message?.content || "";
    return safeText(output);
  } catch (err) {
    console.error("❌ Errore generale in callAI:", err);
    return "";
  }
}

/* =========================================================
   GENERAZIONE TESTI PRODOTTO (blindato)
========================================================= */
async function generateProductAI({ title, description }) {
  try {
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
  } catch (err) {
    console.error("❌ Errore generale in generateProductAI:", err);
    return {
      titoloBreve: "",
      categoria: "",
      descrizioneBreve: ""
    };
  }
}

/* =========================================================
   UPDATE DA PAYHIP (blindato, versione corretta)
========================================================= */
async function updateFromPayhip(data) {
  try {
    if (!data || typeof data !== "object") {
      console.error("❌ updateFromPayhip: dati non validi:", data);
      return;
    }

    const slug = safeSlug(data.slug);
    if (!slug) {
      console.error("❌ updateFromPayhip: slug non valido:", data.slug);
      return;
    }

    const current = safeReadJSON(PRODUCTS_PATH);
    const record = current.find(p => p.slug === slug);

    const descrPulita = safeText(stripHTML(data.description || ""));

    let ai = { titoloBreve: "", categoria: "", descrizioneBreve: "" };

    try {
      if (data.title || descrPulita) {
        ai = await generateProductAI({
          title: data.title || (record ? record.titolo : ""),
          description: descrPulita || (record ? record.descrizioneLunga : "")
        });
      }
    } catch (err) {
      console.error("❌ Errore durante la generazione AI in updateFromPayhip:", err);
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
      console.log(`Airtable è stato aggiornato a partire da Payhip per lo slug "${slug}".`);
    } else {
      console.log(`Nessun record Airtable trovato per lo slug "${slug}". Verrà aggiornata solo la cache Payhip.`);
    }

    PAYHIP_CACHE[slug] = {
      price: data.price,
      title: data.title,
      image: data.image,
      url: data.url
    };

    await syncAirtable();
    loadProducts();

    console.log(`Il catalogo è stato aggiornato da Payhip con AI per lo slug "${slug}".`);
  } catch (err) {
    console.error("❌ Errore generale in updateFromPayhip:", err);
  }
}

/* =========================================================
   UPDATE DA YOUTUBE (blindato)
========================================================= */
function extractSlugFromTitle(title) {
  if (!title) return null;
  const match = title.match(/\[([^\]]+)\]/);
  return match ? match[1].trim().toLowerCase() : null;
}

async function updateFromYouTube(video) {
  try {
    if (!video || typeof video !== "object") {
      console.error("❌ updateFromYouTube: video non valido:", video);
      return;
    }

    const slug = extractSlugFromTitle(video.title);
    if (!slug) {
      console.log("YouTube non ha trovato alcuno slug nel titolo:", video.title);
      return;
    }

    const products = safeReadJSON(PRODUCTS_PATH);
    const record = products.find(p => p.slug === slug);

    if (!record || !record.id) {
      console.log(`YouTube non ha trovato alcun prodotto associato allo slug "${slug}".`);
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

    console.log(`YouTube ha aggiornato correttamente il prodotto con slug "${slug}".`);
  } catch (err) {
    console.error("❌ Errore generale in updateFromYouTube:", err);
  }
}

/* =========================================================
   CARICA CATALOGO (blindato)
========================================================= */
function loadProducts() {
  try {
    PRODUCTS = safeReadJSON(PRODUCTS_PATH);

    if (!Array.isArray(PRODUCTS)) {
      console.error("❌ loadProducts: i dati caricati non sono un array. Verrà resettato l'array prodotti.");
      PRODUCTS = [];
    }

    console.log(`Il catalogo è stato caricato correttamente: ${PRODUCTS.length} prodotti.`);
  } catch (err) {
    console.error("❌ Errore generale in loadProducts:", err);
    PRODUCTS = [];
  }
}

/* =========================================================
   GET PRODOTTI
========================================================= */
function getProducts() {
  return PRODUCTS;
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  syncAirtable,
  loadProducts,
  getProducts,
  updateFromPayhip,
  updateFromYouTube,
  updateAirtableRecord,
  saveSaleToAirtable
};
