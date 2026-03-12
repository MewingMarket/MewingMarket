// categories.js — carica categorie dal backend

async function loadCategories() {
  try {
    const res = await fetch("/data/categories.json");
    if (!res.ok) throw new Error("Impossibile caricare categories.json");

    const categories = await res.json();
    return Array.isArray(categories) ? categories : [];
  } catch (e) {
    console.error("Errore caricamento categorie:", e);
    return [];
  }
}
