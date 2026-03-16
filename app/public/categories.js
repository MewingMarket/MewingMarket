// =========================================================
// categories.js — carica categorie dal backend (SQL READY)
// =========================================================

async function loadCategories() {
  try {
    const res = await fetch("/data/categories.json", { cache: "no-store" });

    if (!res.ok) {
      throw new Error("Impossibile caricare categories.json");
    }

    const categories = await res.json();

    return Array.isArray(categories)
      ? categories.filter(Boolean).sort()
      : [];

  } catch (err) {
    console.error("Errore caricamento categorie:", err);
    return [];
  }
}
