// app/server/modules/ricevuta-fiscale.cjs
const PDFDocument = require("pdfkit");
const { Buffer } = require("buffer");

const MARCA_BOLLO_SOGLIA = 77.47; // soglia classica

function creaPDFBase(ordine, { includeMarcaBollo = false, titolo = "Ricevuta fiscale" }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
    doc.on("error", reject);

    const dataOrdine = ordine.data
      ? new Date(ordine.data).toLocaleDateString("it-IT")
      : new Date().toLocaleDateString("it-IT");

    doc.fontSize(18).text(titolo, { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Data: ${dataOrdine}`);
    doc.text(`Ordine n.: ${ordine.id_ordine || ordine.id || "-"}`);
    doc.moveDown();

    doc.text("Dati cliente:");
    doc.text(`Email: ${ordine.email || "-"}`);
    doc.moveDown();

    doc.text("Descrizione prestazione occasionale:");
    doc.moveDown(0.5);

    if (Array.isArray(ordine.prodotti)) {
      ordine.prodotti.forEach(p => {
        doc.text(`- ${p.titolo} (${p.prezzo}€ x ${p.qty || 1})`);
      });
    }

    doc.moveDown();
    doc.text(`Totale corrisposto: ${ordine.totale}€`, { align: "right" });

    doc.moveDown();

    if (includeMarcaBollo) {
      doc.text("Marca da bollo assolta ai sensi di legge.", { align: "right" });
    } else {
      doc.text("Operazione sotto soglia marca da bollo.", { align: "right" });
    }

    doc.moveDown(2);
    doc.text("Prestazione occasionale ai sensi della normativa italiana.", {
      align: "left"
    });

    doc.end();
  });
}

/**
 * Genera:
 * - pdfCliente: ricevuta generica per il cliente (senza dettaglio marca da bollo)
 * - pdfInternoSenzaBollo: per te, sotto soglia
 * - pdfInternoConBollo: per te, sopra soglia
 */
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
