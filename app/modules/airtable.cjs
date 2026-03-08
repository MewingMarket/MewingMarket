/* =========================================================
   SYNC AIRTABLE — VERSIONE RENDER‑FRIENDLY
   - Nessun eachPage
   - Nessun blocco
   - Nessun real‑time
   - Sync iniziale + sync periodica leggera
========================================================= */

async function syncAirtable() {
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE;
  const TABLE = process.env.AIRTABLE_TABLE_NAME;

  if (!PAT || !BASE || !TABLE) {
    console.log("⏭️ Sync Airtable saltato: variabili mancanti");
    return false;
  }

  const base = new Airtable({ apiKey: PAT }).base(BASE);
  const tableName = decodeURIComponent(TABLE);

  const meta = loadMeta();
  const lastSync = meta.lastSync;

  console.log(`📡 Sync Airtable (modifiche dopo ${lastSync})…`);

  let records = [];
  try {
    records = await base(tableName)
      .select({
        filterByFormula: `LAST_MODIFIED_TIME() > '${lastSync}'`,
        maxRecords: 200
      })
      .all();
  } catch (err) {
    console.error("❌ Errore Airtable:", err.message);
    return false;
  }

  if (records.length === 0) {
    console.log("⏭️ Nessuna modifica — sync veloce");
    global.catalogReady = true;
    return true;
  }

  console.log(`🔄 Modifiche trovate: ${records.length}`);

  loadProducts();

  for (const r of records) {
    const f = r.fields;

    const incoming = {
      id: r.id,
      slug: f.slug || f.Slug || "",
      titolo: f.titolo || f.Titolo || "",
      prezzo: f.prezzo || f.Prezzo || 0,
      categoria: f.categoria || f.Categoria || "",
      paypal_link: f.paypal_link || f.PayPal || "",
      youtube_url: f.youtube_url || f.YouTube || "",
      descrizione:
        f.DescrizioneLunga ||
        f.descrizione ||
        f.Descrizione ||
        "",
      immagine:
        Array.isArray(f.Immagine) && f.Immagine[0]?.url
          ? f.Immagine[0].url
          : "",
      fileProdotto:
        Array.isArray(f.File_consegna) && f.File_consegna[0]?.url
          ? f.File_consegna[0].url
          : ""
    };

    const index = PRODUCTS_CACHE.findIndex((p) => p.id === r.id);

    if (index === -1) {
      PRODUCTS_CACHE.push(incoming);
      console.log("➕ Nuovo prodotto:", incoming.slug);
    } else {
      PRODUCTS_CACHE[index] = { ...PRODUCTS_CACHE[index], ...incoming };
      console.log("♻️ Prodotto aggiornato:", incoming.slug);
    }
  }

  saveProductsToFile(PRODUCTS_CACHE);

  const now = new Date().toISOString();
  saveMeta({ lastSync: now });

  global.catalogReady = true;

  console.log("🟢 Sync Airtable completata");
  return true;
}

/* =========================================================
   SYNC PERIODICA (senza cron)
========================================================= */

setInterval(() => {
  console.log("⏱️ Sync periodica Airtable…");
  syncAirtable();
}, 5 * 60 * 1000); // ogni 5 minuti
