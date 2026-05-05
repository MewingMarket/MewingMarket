// FILE: app/server/services/pdf-generator.cjs
// PATH: app/server/services/pdf-generator.cjs

/**
 * =========================================================
 * PDF GENERATOR — Versione 2026.300
 * Generatore PDF leggero, stabile, compatibile con Render.
 * Usa PDFKit (nessuna dipendenza pesante).
 * =========================================================
 */

const fs = require("fs");
const PDFDocument = require("pdfkit");

/**
 * Genera un PDF a partire da testo semplice.
 * @param {string} contenuto - Testo completo del prodotto digitale
 * @param {string} outputPath - Percorso assoluto del file PDF da creare
 */
async function pdfGenerator(contenuto, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Assicura che la directory esista
      const dir = require("path").dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Crea PDF
      const doc = new PDFDocument({
        size: "A4",
        margin: 50
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Stile base
      doc.font("Helvetica");
      doc.fontSize(12);
      doc.fillColor("#000");

      // Spezza il contenuto in paragrafi
      const paragrafi = contenuto.split("\n");

      paragrafi.forEach(p => {
        doc.text(p.trim(), {
          align: "left"
        });
        doc.moveDown(0.8);
      });

      doc.end();

      stream.on("finish", () => resolve(true));
      stream.on("error", reject);

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = pdfGenerator;
