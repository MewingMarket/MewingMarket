/* =========================================================
   File: app/public/admin/feedback.js
   Admin — Lista completa feedback clienti
   Versione definitiva 2026 (PATCH + DEBUG SUPREMO)
========================================================= */

// Sanitizzazione sicura
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// Fetch blindato (usa adminFetch del loader-admin.js)
async function adminGet(url) {
  console.log("[ADMIN][FETCH] Chiamata a:", url);

  const res = await adminFetch(url);

  console.log("[ADMIN][FETCH] Status:", res.status);

  if (!res.ok) {
    console.error("[ADMIN][FETCH] Errore HTTP:", res.status, res.statusText);
    throw new Error("Errore fetch admin: " + url);
  }

  const json = await res.json();
  console.log("[ADMIN][FETCH] Risposta JSON:", json);

  return json;
}

// =========================================================
// CARICA FEEDBACK (compatibile con admin-feedback.cjs)
// =========================================================
async function caricaFeedback() {
  console.log("🔵 [ADMIN] Avvio caricaFeedback()");

  try {
    console.log("🔵 [ADMIN] Richiedo /api/admin/feedback/lista…");

    const data = await adminGet("/api/admin/feedback/lista");

    console.log("🟣 [ADMIN] Dati ricevuti da backend:", data);

    const tbody = document.querySelector("#tabella-feedback tbody");
    tbody.innerHTML = "";

    if (!data || !Array.isArray(data.feedback)) {
      console.error("❌ [ADMIN] data.feedback NON è un array:", data);
      return;
    }

    console.log("🟢 [ADMIN] Numero feedback:", data.feedback.length);

    data.feedback.forEach((f, idx) => {
      console.log(`   [ADMIN][ROW ${idx}]`, f);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${clean(f.prodotto_titolo)}</td>
        <td>${clean(f.rating)}</td>
        <td>${clean(f.commento)}</td>
        <td>${clean(f.utente_email)}</td>
        <td>${clean(f.data)}</td>
      `;
      tbody.appendChild(tr);
    });

    console.log("🟩 [ADMIN] Feedback renderizzati nella tabella");

  } catch (err) {
    console.error("❌ [ADMIN] Errore caricamento feedback:", err);
  }
}

// =========================================================
// INIT — Avvio solo dopo caricamento header/footer/head
// =========================================================
document.addEventListener("admin-header-loaded", () => {
  console.log("🔵 [ADMIN] Evento admin-header-loaded ricevuto");
  caricaFeedback();
});
