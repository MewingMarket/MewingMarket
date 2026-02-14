// app/modules/payhip.cjs
// Gestione prodotti Payhip → Airtable

const { AirtableBase, AirtableTable } = require("./airtable.cjs");

/* =========================================================
   1) Crea o aggiorna un prodotto Payhip in Airtable
========================================================= */
async function updateFromPayhip(product) {
  const { slug, title, price, image, description, url } = product;

  // Cerca se esiste già un record con questo slug
  const existing = await AirtableTable
    .select({ filterByFormula: `{slug} = "${slug}"` })
    .firstPage();

  if (existing.length > 0) {
    const id = existing[0].id;

    await AirtableTable.update(id, {
      title,
      price,
      image,
      description,
      url,
      slug
    });

    console.log("[PAYHIP] updated", slug);
    return;
  }

  // Se non esiste → crealo
  await AirtableTable.create({
    title,
    price,
    image,
    description,
    url,
    slug
  });

  console.log("[PAYHIP] created", slug);
}

/* =========================================================
   2) Rimuovi prodotti non più presenti su Payhip
========================================================= */
async function removeMissingPayhipProducts(currentSlugs) {
  const all = await AirtableTable.select().all();

  for (const record of all) {
    const slug = record.get("slug");

    if (!slug) continue;

    if (!currentSlugs.includes(slug)) {
      await AirtableTable.destroy(record.id);
      console.log("[PAYHIP] removed_missing", slug);
    }
  }
}

module.exports = {
  updateFromPayhip,
  removeMissingPayhipProducts
};
