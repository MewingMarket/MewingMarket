// modules/payhip.cjs — VERSIONE FUTURE-PROOF + PATCH ANTI-TEMPLATE

console.log("🔥 PAYHIP MODULE LOADED (FUTURE-PROOF + ANTI-TEMPLATE)");

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
   Guard di sicurezza su credenziali Airtable
========================================================= */
function canUseAirtable() {
  if (!AIRTABLE_PAT || !BASE_ID || !TABLE_NAME) {
    console.log("⏭️ Airtable (Payhip) skipped: missing AIRTABLE_PAT / BASE / TABLE_NAME");
    return false;
  }
  return true;
}

/* =========================================================
   Trova record per slug
========================================================= */
async function findRecordBySlug(slug) {
  if (!canUseAirtable()) return null;

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
  if (!canUseAirtable()) return;

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
  if (!canUseAirtable()) return;

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
   PATCH ANTI-TEMPLATE
========================================================= */
function isTemplate(v) {
  return typeof v === "string" && (
    v.includes("{{") ||
    v.includes("}}") ||
    v.includes("product.media") ||
    v.includes("selectedVariant")
  );
}

/* =========================================================
   UPDATE DA PAYHIP (VERSIONE FUTURE-PROOF + PATCH ANTI-TEMPLATE)
========================================================= */
async function updateFromPayhip(data) {
  try {
    console.log("🔥 PATCH PAYHIP FUTURE-PROOF + ANTI-TEMPLATE ATTIVA");

    if (!canUseAirtable()) {
      console.log("⏭️ updateFromPayhip skipped: Airtable non configurato");
      return;
    }

    const slug = safeSlug(data.slug || data.title || data.url);
    if (!slug) return;

    console.log("📦 [PAYHIP RAW]", JSON.stringify(data, null, 2));

    // 1) SCARICO HTML
    const html = await fetch(data.url).then(r => r.text());

    // 2) ESTRAGGO TUTTI I BLOCCHI JSON-LD
    const matches = [...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )];

    if (!matches.length) {
      console.error("❌ Nessun JSON-LD trovato");
      return;
    }

    // 3) PARSO TUTTI I BLOCCHI E CERCO @type: Product
    let productJson = null;

    for (const m of matches) {
      try {
        const parsed = JSON.parse(m[1]);

        if (parsed["@type"] === "Product") {
          productJson = parsed;
          break;
        }

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

    // 4) DATI REALI DA JSON-LD
    const titolo = productJson.name || data.title || "";
    const descrizione = productJson.description || "";
    const prezzo = Number(productJson.offers?.price || 0);
    const immagineUrl = Array.isArray(productJson.image)
      ? productJson.image[0]
      : productJson.image || "";

    const immagine = immagineUrl
      ? [{ url: immagineUrl }]
      : [];

    // 5) COSTRUZIONE CAMPI PER AIRTABLE (ANTI-TEMPLATE)
    const fields = {
      Slug: slug,
      Titolo: titolo,
      TitoloBreve: titolo.slice(0, 48),
      Prezzo: isTemplate(prezzo) ? undefined : prezzo,
      LinkPayhip: data.url,
      DescrizioneLunga: descrizione,
      DescrizioneBreve: descrizione.split(/\s+/).slice(0, 26).join(" "),
      Immagine: isTemplate(immagineUrl) ? undefined : immagine
    };

    // Rimuovi campi undefined
    Object.keys(fields).forEach(k => {
      if (fields[k] === undefined) delete fields[k];
    });

    const safeFields = filterFields(fields);

    // 6) UPDATE O CREATE
    async function findRecordByTitle(title) {
      if (!title || !canUseAirtable()) return null;

      const formula = encodeURIComponent(`{Titolo} = "${title}"`);
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

    const recordBySlug = await findRecordBySlug(slug);
    const recordByTitle = await findRecordByTitle(titolo);

    // 1) Se NON esiste lo slug ma esiste un record con lo stesso titolo → SKIP
    if (!recordBySlug && recordByTitle) {
      console.log(`⏭️ Skip: titolo già presente → ${titolo}`);
      return;
    }

    // 2) Se esiste lo slug → aggiorna
    if (recordBySlug) {
      console.log("🔄 Aggiorno:", slug);
      await updateRecord(recordBySlug.id, safeFields);
      return;
    }

    // 3) Altrimenti crea nuovo record
    console.log("🆕 Creo:", slug);
    await createRecord(safeFields);

  } catch (err) {
    console.error("❌ updateFromPayhip:", err);
  }
}

/* =========================================================
   Rimuovi prodotti non più presenti (PATCH: non cancellare manuali)
========================================================= */
async function removeMissingPayhipProducts(currentSlugs) {
  if (!canUseAirtable()) {
    console.log("⏭️ removeMissingPayhipProducts skipped: Airtable non configurato");
    return;
  }

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

    // PATCH: NON cancellare record manuali
    if (!exists) {
      console.log(`⏭️ Skip delete: ${slug} non esiste su Payhip → record manuale preservato.`);
      continue;
    }
  }
}

module.exports = {
  updateFromPayhip,
  removeMissingPayhipProducts
};
