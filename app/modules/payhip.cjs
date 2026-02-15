// app/modules/payhip.cjs
// Payhip → Airtable (solo campi essenziali, nessun errore)

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
  "Da Payhip?"
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
   Update da Payhip (versione pulita e sicura)
========================================================= */
async function updateFromPayhip(data) {
  try {
    const slug = safeSlug(data.slug || data.title || data.url);
    if (!slug) return;

    const descrPulita = safeText(stripHTML(data.description || ""));

    const prezzo = Number(
      String(data.price || "").replace("€", "").replace(",", ".").trim()
    ) || 0;

    const fields = {
      Slug: slug,
      Titolo: data.title || "",
      TitoloBreve: (data.title || "").slice(0, 48),
      Prezzo: prezzo,
      LinkPayhip: data.url || "",
      DescrizioneLunga: descrPulita,
      DescrizioneBreve: descrPulita.split(/\s+/).slice(0, 26).join(" "),
      Immagine: data.image ? [{ url: data.image }] : [],
      "Da Payhip?": true
    };

    // 🔥 Filtra solo i campi che Airtable accetta
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
   Rimuovi prodotti non più presenti
========================================================= */
async function removeMissingPayhipProducts(currentSlugs) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  if (!Array.isArray(data.records)) return;

  for (const record of data.records) {
    const slug = record.fields.Slug;
    if (!slug) continue;

    if (!currentSlugs.includes(slug)) {
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
