// =========================================================
// FEEDBACK ADMIN — Versione 2026.60 (compatibile loader-admin)
// =========================================================

// Sanitizzazione sicura
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// Fetch blindato
async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore fetch admin: " + url);
  return res.json();
}

// =========================================================
// CARICA FEEDBACK
// =========================================================
async function caricaFeedback() {
  console.log("[ADMIN] Caricamento feedback…");

  try {
    const data = await adminGet("/api/admin/feedback/lista");

    const tbody = document.querySelector("#tabella-feedback tbody");
    tbody.innerHTML = "";

    (data.feedback || []).forEach((f) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${clean(f.prodotto)}</td>
        <td>${clean(f.rating)}</td>
        <td>${clean(f.commento)}</td>
        <td>${clean(f.email)}</td>
        <td>${clean(f.data)}</td>
      `;
      tbody.appendChild(tr);
    });

    console.log("[ADMIN] Feedback caricati");

  } catch (err) {
    console.error("[ADMIN] Errore caricamento feedback:", err);
  }
}

// =========================================================
// INIT — Avvio solo dopo caricamento header/footer/head
// =========================================================
document.addEventListener("admin-header-loaded", caricaFeedback);
