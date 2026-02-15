// modules/payhip.cjs — VERSIONE FUTURE-PROOF (JSON-LD multiplo)

console.log("🔥 PAYHIP MODULE LOADED (FUTURE-PROOF EDITION)");

const fetch = require("node-fetch");
const { safeText, stripHTML, safeSlug } = require("./utils.cjs");

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

/* =========================================================
   Campi realmente esistenti nella tua tabella
========================================================= */
const FIELDS_ALLOWED = [
  "Titolo",
  "TitoloBreve",
  "Slug",
  "Prezzo",
  "LinkPayhip",
  "Immagine",
  "DescrizioneBreve",
  "DescrizioneLunga",
  "youtube_url",
  "youtube_title",
  "youtube_description",
  "youtube_thumbnail",
  "youtube_last_video_url",
  "youtube_last_video_title",
  "Validazione Prodotti"
];

/* =========================================================
   Filtra solo i campi che Airtable accetta
========================================================= */
function filterFields(fields) {
  const clean = {};
  for (const key of Object.keys(fields)) {
    if (FIELDS_ALLOWED.includes(key)) {
      clean[key] = fields[key];
    }
  }
  return clean;
}

/* =========================================================
   Normalizzazione slug
========================================================= */
function normalizeSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   Trova record per slug
========================================================= */
async function findRecordBySlug(slug) {
  const formula = encodeURIComponent(`{Slug} = "${slug}"`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula=${formula}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  return data.records?.[0] || null;
}

/* =========================================================
   Crea record
========================================================= */
async function createRecord(fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  const data = await res.json();
  if (data.error) console.error("❌ createRecord:", data.error);
}

/* =========================================================
   Aggiorna record
========================================================= */
async function updateRecord(id, fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  const data = await res.json();
  if (data.error) console.error("❌ updateRecord:", data.error);
}

/* =========================================================
   UPDATE DA PAYHIP (VERSIONE FUTURE-PROOF)
========================================================= */
async function updateFromPayhip(data) {
  try {
    console.log("🔥 PATCH PAYHIP FUTURE-PROOF ATTIVA");

    const slug = safeSlug(data.slug || data.title || data.url);
    if (!slug) return;

    console.log("📦 [PAYHIP RAW]", JSON.stringify(data, null, 2));

    // ============================================================
    // 1) SCARICO HTML
    // ============================================================
    const html = await fetch(data.url).then(r => r.text());

    // ============================================================
    // 2) ESTRAGGO TUTTI I BLOCCHI JSON-LD
    // ============================================================
    const matches = [...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )];

    if (!matches.length) {
      console.error("❌ Nessun JSON-LD trovato");
      return;
    }

    // ============================================================
    // 3) PARSO TUTTI I BLOCCHI E CERCO @type: Product
    // ============================================================
    let productJson = null;

    for (const m of matches) {
      try {
        const parsed = JSON.parse(m[1]);

        // Caso 1: JSON-LD singolo
        if (parsed["@type"] === "Product") {
          productJson = parsed;
          break;
        }

        // Caso 2: JSON-LD multiplo in array
        if (Array.isArray(parsed)) {
          const found = parsed.find(x => x["@type"] === "Product");
          if (found) {
            productJson = found;
            break;
          }
        }

      } catch (err) {
        continue;
      }
    }

    if (!productJson) {
      console.error("❌ Nessun JSON-LD Product trovato");
      return;
    }

    // ============================================================
    // 4) DATI REALI DA JSON-LD
    // ============================================================
    const titolo = productJson.name || data.title || "";
    const descrizione = productJson.description || "";
    const prezzo = Number(productJson.offers?.price || 0);
    const immagineUrl = Array.isArray(productJson.image)
      ? productJson.image[0]
      : productJson.image || "";

    const immagine = immagineUrl
      ? [{ url: immagineUrl }]
      : [];

    // ============================================================
    // 5) COSTRUZIONE CAMPI PER AIRTABLE
    // ============================================================
    const fields = {
      Slug: slug,
      Titolo: titolo,
      TitoloBreve: titolo.slice(0, 48),
      Prezzo: prezzo,
      LinkPayhip: data.url,
      DescrizioneLunga: descrizione,
      DescrizioneBreve: descrizione.split(/\s+/).slice(0, 26).join(" "),
      Immagine: immagine
    };

    const safeFields = filterFields(fields);

    // ============================================================
    // 6) UPDATE O CREATE
    // ============================================================
    const record = await findRecordBySlug(slug);

    if (record) {
      console.log("🔄 Aggiorno:", slug);
      await updateRecord(record.id, safeFields);
    } else {
      console.log("🆕 Creo:", slug);
      await createRecord(safeFields);
    }

  } catch (err) {
    console.error("❌ updateFromPayhip:", err);
  }
}

/* =========================================================
   Rimuovi prodotti non più presenti
========================================================= */
async function removeMissingPayhipProducts(currentSlugs) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

  const normalizedPayhip = currentSlugs.map(normalizeSlug);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  if (!Array.isArray(data.records)) return;

  if (data.records.length === 0) {
    console.log("🛑 Safety net: Airtable vuoto → nessuna cancellazione.");
    return;
  }

  if (normalizedPayhip.length === 0) {
    console.log("🛑 Safety net: Payhip ha 0 prodotti → nessuna cancellazione.");
    return;
  }

  for (const record of data.records) {
    const slug = normalizeSlug(record.fields.Slug);
    if (!slug) continue;

    const exists = normalizedPayhip.includes(slug);

    if (!exists) {
      console.log("🗑️ Rimuovo:", slug);

      const delUrl = `${url}/${record.id}`;
      await fetch(delUrl, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
      });
    }
  }
}

module.exports = {
  updateFromPayhip,
  removeMissingPayhipProducts
};
