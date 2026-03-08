// =========================================================
// ANALYTICS ADMIN – versione blindata
// =========================================================

const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

async function caricaAnalytics() {
  try {
    const res = await adminFetch("/api/admin/analytics");
    if (!res.ok) throw new Error("Errore fetch analytics");

    const data = await res.json();

    document.getElementById("stats").textContent =
      JSON.stringify(data.stats || {}, null, 2);

    document.getElementById("events").textContent =
      JSON.stringify((data.events || []).slice(-50), null, 2);

  } catch (err) {
    console.error("Errore analytics:", err);
    document.getElementById("stats").textContent = "Errore caricamento dati.";
    document.getElementById("events").textContent = "Errore caricamento eventi.";
  }
}

document.addEventListener("DOMContentLoaded", caricaAnalytics);
