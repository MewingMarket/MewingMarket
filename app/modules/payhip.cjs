// app/modules/payhip.cjs
// Gestione prodotti Payhip → Airtable (API REST) + DEBUG AVANZATO

const fetch = require("node-fetch");
const {
  safeText,
  stripHTML,
  safeSlug
} = require("./utils.cjs");

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;

// ⭐ Nuove variabili
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;   // Nome tabella (REST API)
const TABLE_ID = process.env.AIRTABLE_TABLE_ID;       // ID tabella (metadata)

/* =========================================================
   Verifica tabella corretta tramite ID (metadata API)
   + LOG DI DEBUG POTENTI
========================================================= */
async function verifyTable() {
  try {
    console.log("🔍 [DEBUG] Verifica tabella Airtable...");
    console.log("🔧 BASE_ID:", BASE_ID);
    console.log("🔧 TABLE_NAME:", TABLE_NAME);
    console.log("🔧 TABLE_ID:", TABLE_ID);

    const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`
      }
    });

    const data = await res.json();

    if (!Array.isArray(data.tables)) {
      console.error("❌ [DEBUG] Nessuna tabella trovata nella base.");
      return false;
    }

    // Cerca la tabella per ID
    const byId = data.tables.find(t => t.id === TABLE_ID);

    if (!byId) {
      console.error("❌ [DEBUG] TABLE_ID NON corrisponde a nessuna tabella.");
      console.error("   → Airtable NON riconosce questo ID.");
      console.error("   → Probabile tabella fantasma o ID errato.");
      return false;
    }

    console.log("✅ [DEBUG] Trovata tabella tramite ID:", byId.name);

    // Controlla se il nome corrisponde
    if (byId.name !== TABLE_NAME) {
      console.error("⚠️ [DEBUG] MISMATCH tra TABLE_NAME e nome reale della tabella!");
      console.error("   Nome reale Airtable:", byId.name);
      console.error("   Nome configurato:", TABLE_NAME);
      console.error("   → Airtable userà il NOME, non l'ID.");
      console.error("   → Se TABLE_NAME è sbagliato, creerà una tabella fantasma.");
      return false;
    }

    console.log("🎯 [DEBUG] Nome tabella corretto:", TABLE_NAME);
    console.log("🟢 [DEBUG] Tabella Airtable verificata con successo.");

    return true;

  } catch (err) {
    console.error("❌ [DEBUG] Errore verifyTable:", err);
    return false;
  }
}

/* =========================================================
   UTILS: Generazione TitoloBreve (max 48 caratteri)
========================================================= */
function generaTitoloBreve(titolo) {
  if (!titolo) return "";
  const max = 48;

  if (titolo.length <= max) return titolo.trim();

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
   Update da Payhip (versione definitiva + DEBUG)
========================================================= */
async function updateFromPayhip(data) {
  try {
    await verifyTable(); // ⭐ Verifica tabella prima di scrivere

    const slug = safeSlug(data.slug || data.title || data.url);
    if (!slug) return;

    const descrPulita = safeText(stripHTML(data.description || ""));

    const prezzo = Number(
      String(data.price || "")
        .replace("€", "")
        .replace(",", ".")
        .trim()
    ) || 0;

    const titoloBreve = generaTitoloBreve(data.title || "");
    const descrBreve = generaDescrizioneBreve(descrPulita);

    console.log("📝 [DEBUG] Scrittura prodotto:", {
      slug,
      titolo: data.title,
      prezzo,
      url: data.url,
      image: data.image
    });

    const fields = {
      slug,
      Titolo: data.title || "",
      TitoloBreve: titoloBreve,
      Prezzo: prezzo,
      LinkPayhip: data.url || "",
      DescrizioneLunga: descrPulita,
      DescrizioneBreve: descrBreve,
      Immagine: data.image ? [{ url: data.image }] : []
    };

    const record = await findRecordBySlug(slug);

    if (record) {
      console.log("🔄 [DEBUG] Aggiornamento record esistente:", record.id);
      await updateRecord(record.id, fields);
      console.log("🟢 [PAYHIP] updated", slug);
    } else {
      console.log("🆕 [DEBUG] Creazione nuovo record...");
      await createRecord(fields);
      console.log("🟢 [PAYHIP] created", slug);
    }

  } catch (err) {
    console.error("❌ Errore updateFromPayhip:", err);
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
      console.log("🗑️ [DEBUG] Rimozione prodotto non più presente:", slug);

      const delUrl = `${url}/${record.id}`;
      await fetch(delUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${AIRTABLE_PAT}`
        }
      });
    }
  }
}

module.exports = {
  updateFromPayhip,
  removeMissingPayhipProducts
};
