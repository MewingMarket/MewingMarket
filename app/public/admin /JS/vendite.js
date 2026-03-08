// =========================================================
// VENDITE ADMIN – versione blindata
// =========================================================

// Sanitizzazione
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// Status box
function setStatus(msg, ok = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? "green" : "red";
}

// Elementi DOM
const boxTotaleVendite = document.getElementById("totale-vendite");
const boxTotaleRicavi = document.getElementById("totale-ricavi");
const boxNumeroOrdini = document.getElementById("numero-ordini");
const boxConversione = document.getElementById("conversione");

const tabella = document.querySelector("#tabella-vendite tbody");

// =========================================================
// FETCH BLINDATO
// =========================================================

async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore fetch admin: " + url);
  return res.json();
}

// =========================================================
// 1. CARICA DATI VENDITE
// =========================================================

async function caricaVendite() {
  setStatus("Caricamento vendite...");

  try {
    const data = await adminGet("/api/admin/vendite/lista");

    if (!data.success) {
      setStatus(data.error || "Errore caricamento vendite");
      return;
    }

    setStatus("", true);

    // =========================================================
    // 2. AGGIORNA STATISTICHE
    // =========================================================

    boxTotaleVendite.textContent = clean(data.stats.totaleVendite);
    boxTotaleRicavi.textContent = clean(data.stats.totaleRicavi.toFixed(2)) + " €";
    boxNumeroOrdini.textContent = clean(data.stats.numeroOrdini);
    boxConversione.textContent = clean(data.stats.conversione) + "%";

    // =========================================================
    // 3. RIEMPI TABELLA
    // =========================================================

    tabella.innerHTML = "";

    (data.vendite || []).forEach((v) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${clean(v.data)}</td>
        <td>${clean(v.prodotto)}</td>
        <td>${clean(v.prezzo)} €</td>
        <td>${clean(v.email)}</td>
        <td>${clean(v.metodo)}</td>
      `;
      tabella.appendChild(tr);
    });

  } catch (err) {
    console.error("Errore vendite:", err);
    setStatus("Errore di connessione");
  }
}

// =========================================================
// 4. INIT
// =========================================================

document.addEventListener("DOMContentLoaded", caricaVendite);
