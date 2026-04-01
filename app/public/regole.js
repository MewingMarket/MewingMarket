/* =========================================================
   File: app/public/regole.js
   Regolamento dinamico — Versione definitiva 2026
========================================================= */

document.addEventListener("DOMContentLoaded", caricaRegolamento);

async function caricaRegolamento() {
  const box = document.getElementById("regolamentoBox");

  try {
    const res = await fetch("/regole.json");
    const data = await res.json();

    if (!data || !Array.isArray(data.sezioni)) {
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

  } catch (err) {
    console.error("Errore caricamento regolamento:", err);
    box.innerHTML = "<p>Errore nel caricamento.</p>";
  }
}
