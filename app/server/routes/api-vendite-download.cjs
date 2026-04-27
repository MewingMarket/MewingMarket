/* =========================================================
   FILE: app/server/routes/api-vendite-download.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Download sicuro dei prodotti acquistati
   ORIGINALE: ex GET /vendite/download/:id e /vendite/download-direct/:token
========================================================= */

const path = require("path");
const fs = require("fs");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");

// Percorso persistente dei file prodotto
const FILES_DIR = "/var/data/uploads/files";

/* =========================================================
   Helper JSON
========================================================= */
function safeParse(str) {
  try { return JSON.parse(str); }
  catch { return []; }
}

/* =========================================================
   FUNZIONE 1 — downloadAutenticato
   (ex GET /vendite/download/:id)
========================================================= */
async function downloadAutenticato(req, res) {
  try {
    const userId = req.user.id;
    const prodottoId = parseInt(req.params.id, 10);

    if (!prodottoId) {
      return res.status(400).json({
        success: false,
        error: "ID prodotto mancante"
      });
    }

    console.log("📥 Richiesta download prodotto:", prodottoId, "da utente:", userId);

    // Verifica acquisto
    const ordini = db.prepare(`
      SELECT prodotti_json
      FROM ordini
      WHERE utente_id = ?
        AND stato = 'completato'
    `).all(userId);

    let trovato = false;

    for (const o of ordini) {
      const prodotti = safeParse(o.prodotti_json);
      if (prodotti.some(p => p.prodotto_id === prodottoId)) {
        trovato = true;
        break;
      }
    }

    if (!trovato) {
      console.log("❌ Download negato: prodotto non acquistato");
      return res.status(403).json({
        success: false,
        error: "Non hai acquistato questo prodotto"
      });
    }

    // Recupera info prodotto
    const prodotto = db.prepare(`
      SELECT titolo, titolo_breve, file_consegna_url
      FROM prodotti
      WHERE id = ?
      LIMIT 1
    `).get(prodottoId);

    if (!prodotto || !prodotto.file_consegna_url) {
      return res.status(404).json({
        success: false,
        error: "File non trovato"
      });
    }

    let raw = prodotto.file_consegna_url.trim();
    if (raw.startsWith("http")) raw = raw.split("/").pop();

    const filePath = path.join(FILES_DIR, raw);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "File non presente sul server"
      });
    }

    const nomeDownload = (prodotto.titolo || prodotto.titolo_breve || "prodotto") + ".pdf";

    console.log("⬇️ Avvio download:", nomeDownload);

    return res.download(filePath, nomeDownload, err => {
      if (err) {
        console.error("❌ Errore download:", err);
        return res.status(500).json({
          success: false,
          error: "Errore durante il download"
        });
      }

      console.log("✅ Download completato:", nomeDownload);
    });

  } catch (err) {
    console.error("❌ Errore downloadAutenticato:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
}

/* =========================================================
   FUNZIONE 2 — downloadDirect
   (ex GET /vendite/download-direct/:token)
========================================================= */
async function downloadDirect(req, res) {
  try {
    const token = req.params.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token mancante"
      });
    }

    console.log("🔑 Download diretto con token:", token);

    // Recupera ordine tramite token
    const ordine = db.prepare(`
      SELECT id, prodotti_json
      FROM ordini
      WHERE download_token = ?
        AND stato = 'completato'
      LIMIT 1
    `).get(token);

    if (!ordine) {
      return res.status(403).json({
        success: false,
        error: "Token non valido"
      });
    }

    const prodotti = safeParse(ordine.prodotti_json);
    if (!prodotti.length) {
      return res.status(404).json({
        success: false,
        error: "Nessun prodotto associato all'ordine"
      });
    }

    // MODEL A: scarica sempre il primo prodotto
    const prodottoId = prodotti[0].prodotto_id;

    const prodotto = db.prepare(`
      SELECT titolo, titolo_breve, file_consegna_url
      FROM prodotti
      WHERE id = ?
      LIMIT 1
    `).get(prodottoId);

    if (!prodotto || !prodotto.file_consegna_url) {
      return res.status(404).json({
        success: false,
        error: "File non trovato"
      });
    }

    let raw = prodotto.file_consegna_url.trim();
    if (raw.startsWith("http")) raw = raw.split("/").pop();

    const filePath = path.join(FILES_DIR, raw);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "File non presente sul server"
      });
    }

    const nomeDownload = (prodotto.titolo || prodotto.titolo_breve || "prodotto") + ".pdf";

    console.log("⬇️ Download diretto:", nomeDownload);

    return res.download(filePath, nomeDownload, err => {
      if (err) {
        console.error("❌ Errore download diretto:", err);
        return res.status(500).json({
          success: false,
          error: "Errore durante il download"
        });
      }

      console.log("✅ Download diretto completato:", nomeDownload);
    });

  } catch (err) {
    console.error("❌ Errore downloadDirect:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  downloadAutenticato,
  downloadDirect
};
