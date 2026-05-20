/* =========================================================
   REGOLE.JS — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [REGOLE 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [REGOLE 2058] pageInit() avviata");
  caricaRegolamento();
};

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
