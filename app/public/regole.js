/* =========================================================
   File: app/public/regole.js
   Regolamento dinamico — Versione definitiva 2026
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [REGOLE] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [REGOLE] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [REGOLE] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [REGOLE] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [REGOLE] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [REGOLE] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [REGOLE] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [REGOLE] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [REGOLE] critical-ready già presente → avvio caricamento regolamento");

  caricaRegolamento();
}

/* =========================================================
   CARICAMENTO REGOLE (TUO CODICE ORIGINALE)
========================================================= */
async function caricaRegolamento() {
  console.log("📥 [REGOLE] Caricamento regolamento…");

  const box = document.getElementById("regolamentoBox");
  if (!box) {
    console.warn("❌ [REGOLE] regolamentoBox NON trovato");
    return;
  }

  try {
    const res = await fetch("/regole.json");
    console.log("📦 [REGOLE] Risposta fetch:", res);

    const data = await res.json();
    console.log("📄 [REGOLE] JSON:", data);

    if (!data || !Array.isArray(data.sezioni)) {
      console.warn("⚠️ [REGOLE] Formato JSON non valido");
      box.innerHTML = "<p>Errore nel caricamento del regolamento.</p>";
      return;
    }

    box.innerHTML = data.sezioni
      .map(sez => `
        <section class="regola-sezione">
          <h2>${sez.titolo}</h2>
          <ul>
            ${sez.regole.map(r => `<li>${r}</li>`).join("")}
          </ul>
        </section>
      `)
      .join("");

    console.log("🟢 [REGOLE] Regolamento renderizzato correttamente");

  } catch (err) {
    console.error("🔥 [REGOLE] Errore caricamento regolamento:", err);
    box.innerHTML = "<p>Errore nel caricamento.</p>";
  }
}
