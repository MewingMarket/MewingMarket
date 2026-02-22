// app/public/admin/js/analisi.js

async function caricaAnalisi() {
  const res = await adminFetch("/api/admin/analisi/dati");
  const data = await res.json();

  document.getElementById("conv-rate").textContent = data.stats.conversione + "%";
  document.getElementById("traffico-totale").textContent = data.stats.traffico;
  document.getElementById("ctr-medio").textContent = data.stats.ctr + "%";

  const tbodyProd = document.querySelector("#tabella-analisi-prodotti tbody");
  tbodyProd.innerHTML = "";
  data.prodotti.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nome}</td>
      <td>${p.visite}</td>
      <td>${p.carrelli}</td>
      <td>${p.vendite}</td>
      <td>${p.conversione}%</td>
    `;
    tbodyProd.appendChild(tr);
  });

  const tbodyTraffico = document.querySelector("#tabella-traffico tbody");
  tbodyTraffico.innerHTML = "";
  data.traffico.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.origine}</td>
      <td>${t.visite}</td>
      <td>${t.ctr}%</td>
      <td>${t.conversione}%</td>
    `;
    tbodyTraffico.appendChild(tr);
  });

  const tbodyUTM = document.querySelector("#tabella-utm tbody");
  tbodyUTM.innerHTML = "";
  data.utm.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.campagna}</td>
      <td>${u.visite}</td>
      <td>${u.vendite}</td>
      <td>${u.conversione}%</td>
    `;
    tbodyUTM.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", caricaAnalisi);
