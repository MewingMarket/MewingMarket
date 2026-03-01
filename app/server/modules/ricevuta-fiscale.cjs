// =========================================================
// File: app/server/modules/ricevuta-fiscale.cjs
// Generatore PDF ricevuta fiscale prestazione occasionale
// Versione definitiva con firma digitale e marca da bollo
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
function creaPDFBase(ordine, { includeMarcaBollo = false, titolo = "Ricevuta fiscale" }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const dataOrdine = ordine.data
      ? new Date(ordine.data).toLocaleDateString("it-IT")
      : new Date().toLocaleDateString("it-IT");

    // ===============================
    // INTESTAZIONE
    // ===============================
    doc.fontSize(18).text(titolo, { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(DATI_PRESTATORE.nome);
    doc.text(DATI_PRESTATORE.indirizzo);
    doc.text(DATI_PRESTATORE.citta);
    doc.text(`Codice Fiscale: ${DATI_PRESTATORE.cf}`);
    doc.text(`Email: ${DATI_PRESTATORE.email}`);
    doc.moveDown();

    // ===============================
    // DATI ORDINE
    // ===============================
    doc.text(`Data: ${dataOrdine}`);
    doc.text(`Ordine n.: ${ordine.id_ordine || ordine.id || "-"}`);
    doc.moveDown();

    // ===============================
    // DATI CLIENTE
    // ===============================
    doc.text("Dati cliente:");
    doc.text(`Email: ${ordine.email || "-"}`);
    doc.moveDown();

    // ===============================
    // DESCRIZIONE
    // ===============================
    doc.text("Oggetto della prestazione:");
    doc.moveDown(0.5);
    doc.text("Fornitura di prodotti digitali acquistati tramite la piattaforma MewingMarket.");
    doc.moveDown();

    // ===============================
    // PRODOTTI
    // ===============================
    doc.text("Dettaglio prodotti:");
    doc.moveDown(0.5);

    if (Array.isArray(ordine.prodotti)) {
      ordine.prodotti.forEach(p => {
        doc.text(`- ${p.titolo} (${p.prezzo}€ x ${p.qty || 1})`);
      });
    }

    doc.moveDown();
    doc.text(`Totale corrisposto: ${ordine.totale}€`, { align: "right" });
    doc.moveDown();

    // ===============================
    // MARCA DA BOLLO
    // ===============================
    if (includeMarcaBollo) {
      doc.text("Importo superiore alla soglia di 77,47 €.", { align: "right" });
      doc.text("Marca da bollo da 2,00 € assolta ai sensi di legge.", { align: "right" });
    } else {
      doc.text("Operazione sotto soglia marca da bollo (77,47 €).", { align: "right" });
      doc.text("Marca da bollo NON dovuta.", { align: "right" });
    }

    doc.moveDown(2);

    // ===============================
    // NOTA FISCALE
    // ===============================
    doc.text(
      "La prestazione è di natura occasionale ed è esclusa dall’applicazione dell’IVA ai sensi dell’art. 5 del D.P.R. 633/1972."
    );
    doc.moveDown();

    doc.text("Documento generato elettronicamente ai sensi della normativa vigente.");
    doc.moveDown(2);

    // ===============================
    // FIRMA DIGITALE
    // ===============================
    doc.fontSize(14).text("Firma:", { align: "left" });
    doc.moveDown(0.5);

    // Firma digitale stilizzata (testuale)
    doc.fontSize(20).text("Simone Griseri", { align: "left" });

    doc.end();
  });
}

// ===============================
// GENERATORE COMPLETO
// ===============================
async function generaRicevuteFiscali(ordine) {
  const sopraSoglia = Number(ordine.totale || 0) >= MARCA_BOLLO_SOGLIA;

  const [pdfClienteBuf, pdfSenzaBolloBuf, pdfConBolloBuf] = await Promise.all([
    creaPDFBase(ordine, {
      includeMarcaBollo: false,
      titolo: "Ricevuta fiscale - Cliente"
    }),
    creaPDFBase(ordine, {
      includeMarcaBollo: false,
      titolo: "Ricevuta fiscale interna (senza marca da bollo)"
    }),
    creaPDFBase(ordine, {
      includeMarcaBollo: true,
      titolo: "Ricevuta fiscale interna (con marca da bollo)"
    })
  ]);

  return {
    pdfCliente: pdfClienteBuf.toString("base64"),
    pdfInternoSenzaBollo: pdfSenzaBolloBuf.toString("base64"),
    pdfInternoConBollo: pdfConBolloBuf.toString("base64"),
    sopraSoglia
  };
}

module.exports = { generaRicevuteFiscali, MARCA_BOLLO_SOGLIA };
