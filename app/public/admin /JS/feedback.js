// app/public/admin/js/feedback.js

async function caricaFeedback() {
  const res = await adminFetch("/api/admin/feedback/lista");
  const data = await res.json();

  const tbody = document.querySelector("#tabella-feedback tbody");
  tbody.innerHTML = "";

  (data.feedback || []).forEach(f => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${f.prodotto}</td>
      <td>${f.rating}</td>
      <td>${f.commento}</td>
      <td>${f.data}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", caricaFeedback);
