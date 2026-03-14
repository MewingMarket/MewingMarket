/* =========================================================
   FILE: /public/ordini.js
   ORDINI PREMIUM — MewingMarket
   Versione definitiva SQL-safe + UX migliorata
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");
  const body = document.getElementById("ordersBody");

  if (!session || !email) {
    body.innerHTML = `<tr><td colspan="5">Devi effettuare il login.</td></tr>`;
    return;
  }

  /* =========================================================
     1) Recupera ordini utente
  ========================================================== */
  let data;
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: {
        "Authorization": `Bearer ${session}`
      }
    });

    data = await res.json();
  } catch (err) {
    console.error("Errore fetch /ordini/utente:", err);
    body.innerHTML = `<tr><td colspan="5">Errore di connessione.</td></tr>`;
    return;
  }

  if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="5">Nessun ordine trovato.</td></tr>`;
    return;
  }

  /* =========================================================
     2) Render ordini
  ========================================================== */
  data.ordini.forEach(o => {
    const tr = document.createElement("tr");

    const prodottiHTML = Array.isArray(o.prodotti)
      ? o.prodotti
          .map(p => `${p.titolo} (${p.prezzo}€ × ${p.qty || 1})`)
          .join("<br>")
      : "-";

    const annullaBtn =
      o.stato === "completato" || o.stato === "annullato"
        ? ""
        : `<button class="btn-annulla" data-id="${o.id}">Annulla</button>`;

    tr.innerHTML = `
      <td>${new Date(o.data).toLocaleDateString("it-IT")}</td>
      <td>${prodottiHTML}</td>
      <td>${o.totale}€</td>
      <td>${o.stato}</td>
      <td>${annullaBtn}</td>
    `;

    body.appendChild(tr);
  });

  /* =========================================================
     3) Annulla ordine
  ========================================================== */
  body.addEventListener("click", async e => {
    if (!e.target.classList.contains("btn-annulla")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    if (!confirm("Vuoi annullare questo ordine?")) return;

    try {
      const res = await fetch(`/api/ordini/annulla/${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Errore annullamento.");
        return;
      }

      alert("Ordine annullato.");
      location.reload();

    } catch (err) {
      console.error("Errore annullamento ordine:", err);
      alert("Errore di connessione.");
    }
  });
});
