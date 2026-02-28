document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("utenteEmail");
  const body = document.getElementById("ordersBody");

  if (!token || !email) {
    body.innerHTML = `<tr><td colspan="5">Devi effettuare il login.</td></tr>`;
    return;
  }

  // 1) Recupera ordini dell’utente
  let data;
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: { "x-token": token }
    });
    data = await res.json();
  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="5">Errore di connessione.</td></tr>`;
    return;
  }

  if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="5">Nessun ordine trovato.</td></tr>`;
    return;
  }

  // 2) Mostra ordini
  data.ordini.forEach(o => {
    const tr = document.createElement("tr");

    const prodottiHTML = Array.isArray(o.prodotti)
      ? o.prodotti.map(p => `${p.titolo} (${p.prezzo}€)`).join("<br>")
      : "-";

    const downloadBtns = Array.isArray(o.prodotti)
      ? o.prodotti
          .map(
            p => `<a class="btn-download" href="/api/vendite/download/${p.slug}?token=${token}">Download</a>`
          )
          .join("<br>")
      : "-";

    const annullaBtn =
      o.stato !== "completato" &&
      o.stato !== "COMPLETED" &&
      o.stato !== "annullato"
        ? `<button class="btn-cancel" onclick="annullaOrdine('${o.id}')">Annulla</button>`
        : "";

    tr.innerHTML = `
      <td>${new Date(o.data).toLocaleDateString("it-IT")}</td>
      <td>${prodottiHTML}</td>
      <td>${o.totale}€</td>
      <td>${o.stato}</td>
      <td>${downloadBtns}<br>${annullaBtn}</td>
    `;

    body.appendChild(tr);
  });
});

// 3) Funzione annulla ordine
async function annullaOrdine(id) {
  const token = localStorage.getItem("token");

  if (!confirm("Vuoi davvero annullare questo ordine?")) return;

  try {
    const res = await fetch(`/api/ordini/annulla/${id}`, {
      method: "POST",
      headers: { "x-token": token }
    });

    const data = await res.json();

    if (data.success) {
      alert("Ordine annullato.");
      location.reload();
    } else {
      alert(data.error || "Errore.");
    }
  } catch {
    alert("Errore di connessione.");
  }
}
