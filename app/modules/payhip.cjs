// app/modules/payhip.cjs
// Gestione prodotti Payhip → Airtable (API REST)

const fetch = require("node-fetch");
const {
  safeText,
  stripHTML,
  safeSlug
} = require("./utils.cjs");

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE;

/* =========================================================
   Trova record per slug
========================================================= */
async function findRecordBySlug(slug) {
  const formula = encodeURIComponent(`{slug} = "${slug}"`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula=${formula}`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  return Array.isArray(data.records) && data.records.length > 0
    ? data.records[0]
    : null;
}

/* =========================================================
   Crea record
========================================================= */
async function createRecord(fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });
}

/* =========================================================
   Aggiorna record
========================================================= */
async function updateRecord(id, fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`;

  await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });
}

/* =========================================================
   Update da Payhip
========================================================= */
async function updateFromPayhip(data) {
  try {
    const slug = safeSlug(data.slug);
    if (!slug) return;

    const descrPulita = safeText(stripHTML(data.description || ""));

    const fields = {
      slug,
      Titolo: data.title,
      Prezzo: data.price,
      LinkPayhip: data.url,
      DescrizioneLunga: descrPulita,
      Immagine: data.image ? [{ url: data.image }] : undefined
    };

    const record = await findRecordBySlug(slug);

    if (record) {
      await updateRecord(record.id, fields);
      console.log("[PAYHIP] updated", slug);
    } else {
      await createRecord(fields);
      console.log("[PAYHIP] created", slug);
    }

  } catch (err) {
    console.error("Errore updateFromPayhip:", err);
  }
}

/* =========================================================
   Rimuovi prodotti non più presenti
========================================================= */
async function removeMissingPayhipProducts(currentSlugs) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  if (!Array.isArray(data.records)) return;

  for (const record of data.records) {
    const slug = record.fields.slug;
    if (!slug) continue;

    if (!currentSlugs.includes(slug)) {
      const delUrl = `${url}/${record.id}`;
      await fetch(delUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${AIRTABLE_PAT}`
        }
      });
      console.log("[PAYHIP] removed_missing", slug);
    }
  }
}

module.exports = {
  updateFromPayhip,
  removeMissingPayhipProducts
};
