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
   UTILS: Generazione TitoloBreve (max 48 caratteri)
========================================================= */
function generaTitoloBreve(titolo) {
  if (!titolo) return "";
  const max = 48;

  if (titolo.length <= max) return titolo.trim();

  // taglio elegante senza spezzare parole
  let breve = titolo.slice(0, max);
  breve = breve.slice(0, breve.lastIndexOf(" "));
  return breve.trim() + "...";
}

/* =========================================================
   UTILS: Generazione DescrizioneBreve (prime 26 parole)
========================================================= */
function generaDescrizioneBreve(descr) {
  if (!descr) return "";
  const parole = descr.split(/\s+/);
  if (parole.length <= 26) return descr.trim();

  return parole.slice(0, 26).join(" ").trim() + "...";
}

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
   Aggiorna record (forzato)
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
   Update da Payhip (versione definitiva)
========================================================= */
async function updateFromPayhip(data) {
  try {
    // Slug sicuro
    const slug = safeSlug(data.slug || data.title || data.url);
    if (!slug) return;

    // Descrizione pulita
    const descrPulita = safeText(stripHTML(data.description || ""));

    // Prezzo numerico
    const prezzo = Number(
      String(data.price || "")
        .replace("€", "")
        .replace(",", ".")
        .trim()
    ) || 0;

    // Generazione automatica
    const titoloBreve = generaTitoloBreve(data.title || "");
    const descrBreve = generaDescrizioneBreve(descrPulita);

    // Campi da salvare SEMPRE
    const fields = {
      slug,
      Titolo: data.title || "",
      TitoloBreve: titoloBreve,
      Prezzo: prezzo,
      LinkPayhip: data.url || "",
      DescrizioneLunga: descrPulita,
      DescrizioneBreve: descrBreve
    };

    // Immagine sempre aggiornata
    fields.Immagine = data.image
      ? [{ url: data.image }]
      : [];

    const record = await findRecordBySlug(slug);

    if (record) {
      await updateRecord(record.id, fields);
      console.log("[PAYHIP] updated (forced)", slug);
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
