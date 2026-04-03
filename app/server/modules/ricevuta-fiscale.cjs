// =========================================================
// File: app/server/modules/ricevuta-fiscale.cjs
// Generatore PDF ricevuta fiscale prestazione occasionale
// Layout stile Quickfisco + Logo + Tabella prodotti
// Versione definitiva 2026 — PATCH 2026.2001
// - 1 ricevuta cliente
// - 1 ricevuta interna
// =========================================================

const PDFDocument = require("pdfkit");
const { Buffer } = require("buffer");

const MARCA_BOLLO_SOGLIA = 77.47;

// ===============================
// DATI FISCALI MEWINGMARKET
// ===============================
const DATI_PRESTATORE = {
  nome: "MewingMarket",
  indirizzo: "Strada Ciousse 35",
  citta: "18038 Sanremo (IM) – Liguria, Italia",
  cf: "GRSSMN92H25I138W",
  email: "supporto@mewingmarket.it"
};

// ===============================
// FUNZIONE BASE PER CREARE PDF
// ===============================
function creaPDF(ordine, { includeMarcaBollo = false, numeroRicevuta }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const dataOrdine = ordine.data
      ? new Date(ordine.data).toLocaleDateString("it-IT")
      : new Date().toLocaleDateString("it-IT");

    // LOGO
    try {
      doc.image("app/public/logo.png", 50, 40, { width: 120 });
    } catch {}

    doc.moveDown(3);

    // TITOLO
    doc.fontSize(20).text(`Ricevuta fiscale n. ${numeroRicevuta}`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`del ${dataOrdine}`, { align: "center" });
    doc.moveDown(2);

    // DATI PRESTATORE
    doc.fontSize(14).text("Dati Prestatore", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(DATI_PRESTATORE.nome);
    doc.text(DATI_PRESTATORE.indirizzo);
    doc.text(DATI_PRESTATORE.citta);
    doc.text(`Codice Fiscale: ${DATI_PRESTATORE.cf}`);
    doc.text(`Email: ${DATI_PRESTATORE.email}`);
    doc.moveDown(1.5);

    // DATI CLIENTE
    doc.fontSize(14).text("Dati Cliente", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Email: ${ordine.email || "-"}`);
    doc.text(`Codice Fiscale: ${ordine.codice_fiscale || "-"}`);
    doc.moveDown(1.5);

    // OGGETTO
    doc.fontSize(14).text("Oggetto della prestazione", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text("Fornitura di prodotti digitali acquistati tramite la piattaforma MewingMarket.");
    doc.moveDown(1.5);

    // TABELLA PRODOTTI
    doc.fontSize(14).text("Dettaglio prodotti", { underline: true });
    doc.moveDown(0.8);

    const startX = 50;
    let y = doc.y;

    doc.rect(startX, y, 500, 25).stroke();
    doc.fontSize(12).text("Prodotto", startX + 10, y + 7);
    doc.text("Prezzo", startX + 350, y + 7);
    y += 25;

    if (Array.isArray(ordine.prodotti)) {
      ordine.prodotti.forEach(p => {
        const prezzoEuro = (p.prezzo_cent / 100).toFixed(2);
        const qty = p.qty || 1;

        doc.rect(startX, y, 500, 25).stroke();
        doc.text(p.titolo, startX + 10, y + 7);
        doc.text(`${prezzoEuro}€ x ${qty}`, startX + 350, y + 7);
        y += 25;
      });
    }

    doc.moveDown(3);

    // TOTALE + MARCA DA BOLLO
    doc.fontSize(14).text("Totale", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Totale corrisposto: ${ordine.totale}€`);

    if (includeMarcaBollo) {
      doc.moveDown(1);
      doc.text("Importo superiore alla soglia di 77,47 €.");
      doc.text("Marca da bollo da 2,00 € assolta ai sensi di legge.");
      doc.moveDown(1);
      doc.rect(doc.x, doc.y, 120, 120).stroke();
      doc.text("Incolla qui la marca da bollo", doc.x + 10, doc.y + 10);
      doc.moveDown(8);
    } else {
      doc.moveDown(1);
      doc.text("Operazione sotto soglia marca da bollo (77,47 €).");
      doc.text("Marca da bollo NON dovuta.");
    }

    doc.moveDown(2);

    // METODO DI PAGAMENTO
    doc.fontSize(14).text("Metodo di pagamento", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text("PayPal");
    doc.moveDown(2);

    // NOTE FISCALI
    doc.fontSize(12).text(
      "La prestazione è di natura occasionale ed è esclusa dall’applicazione dell’IVA ai sensi dell’art. 5 del D.P.R. 633/1972."
    );
    doc.moveDown();
    doc.text("Documento generato elettronicamente ai sensi della normativa vigente.");
    doc.moveDown(2);

    // FIRMA
    doc.fontSize(14).text("Firma:");
    doc.moveDown(0.5);
    doc.fontSize(20).text("Simone Griseri");

    doc.end();
  });
}

// ===============================
// GENERATORE COMPLETO — 1 cliente + 1 interno
// ===============================
async function generaRicevuteFiscali(ordine) {
  const sopraSoglia = Number(ordine.totale || 0) >= MARCA_BOLLO_SOGLIA;

  const numeroRicevuta = ordine.id_ordine || ordine.id || "0";

  // Cliente → include bollo se sopra soglia
  const pdfCliente = await creaPDF(ordine, {
    includeMarcaBollo: sopraSoglia,
    numeroRicevuta
  });

  // Interno → stessa logica del cliente
  const pdfInterno = await creaPDF(ordine, {
    includeMarcaBollo: sopraSoglia,
    numeroRicevuta
  });

  return {
    pdfCliente: pdfCliente.toString("base64"),
    pdfInterno: pdfInterno.toString("base64"),
    sopraSoglia
  };
}

module.exports = { generaRicevuteFiscali, MARCA_BOLLO_SOGLIA };
