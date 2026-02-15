// modules/payhip.cjs — VERSIONE DEFINITIVA

const fetch = require("node-fetch");
const { safeText, stripHTML, safeSlug } = require("./utils.cjs");

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

/* =========================================================
   Campi realmente esistenti nella tua tabella (13 campi)
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
   Normalizzazione slug (case-insensitive, accent-insensitive)
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
   Update da Payhip (versione definitiva)
========================================================= */
async function updateFromPayhip(data) {
  try {
    const slug = safeSlug(data.slug || data.title || data.url);
    if (!slug) return;

    // --- DESCRIZIONE ---
    const descrPulita = safeText(stripHTML(data.description || ""));

    // --- PREZZO ---
    let prezzo = 0;
    if (data.price) {
      prezzo = Number(
        String(data.price)
          .replace(/[^\d.,]/g, "")
          .replace(",", ".")
      );
      if (isNaN(prezzo)) prezzo = 0;
    }

    // --- IMMAGINE ---
    let immagine = [];
    if (data.image && typeof data.image === "string" && data.image.startsWith("http")) {
      immagine = [{ url: data.image }];
    }

    const fields = {
      Slug: slug,
      Titolo: data.title || "",
      TitoloBreve: (data.title || "").slice(0, 48),
      Prezzo: prezzo,
      LinkPayhip: data.url || "",
      DescrizioneLunga: descrPulita,
      DescrizioneBreve: descrPulita.split(/\s+/).slice(0, 26).join(" "),
      Immagine: immagine
    };

    const safeFields = filterFields(fields);

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
   Rimuovi prodotti non più presenti (case-insensitive + safety net)
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
