/* =========================================================
   FILE: app/server/routes/api-vendite-download.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Download sicuro dei prodotti acquistati
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
========================================================= */
async function downloadAutenticato(req) {
  console.log("[DEBUG download] downloadAutenticato()");

  try {
    const userId = req.user.id;
    const prodottoId = parseInt(req.params.id, 10);

    if (!prodottoId) {
      return { success: false, error: "ID prodotto mancante" };
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
      return { success: false, error: "Non hai acquistato questo prodotto" };
    }

    // Recupera info prodotto
    const prodotto = db.prepare(`
      SELECT titolo, titolo_breve, file_consegna_url
      FROM prodotti
      WHERE id = ?
      LIMIT 1
    `).get(prodottoId);

    if (!prodotto || !prodotto.file_consegna_url) {
      return { success: false, error: "File non trovato" };
    }

    let raw = prodotto.file_consegna_url.trim();
    if (raw.startsWith("http")) raw = raw.split("/").pop();

    const filePath = path.join(FILES_DIR, raw);

    if (!fs.existsSync(filePath)) {
      return { success: false, error: "File non presente sul server" };
    }

    const nomeDownload = (prodotto.titolo || prodotto.titolo_breve || "prodotto") + ".pdf";

    console.log("⬇️ Download pronto:", nomeDownload);

    // Java‑mode → ritorno dati, non stream
    return {
      success: true,
      filePath,
      filename: nomeDownload
    };

  } catch (err) {
    console.error("❌ Errore downloadAutenticato:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   FUNZIONE 2 — downloadDirect
========================================================= */
async function downloadDirect(req) {
  console.log("[DEBUG download] downloadDirect()");

  try {
    const token = req.params.token;

    if (!token) {
      return { success: false, error: "Token mancante" };
    }

    console.log("🔑 Download diretto con token:", token);

    const ordine = db.prepare(`
      SELECT id, prodotti_json
      FROM ordini
      WHERE download_token = ?
        AND stato = 'completato'
      LIMIT 1
    `).get(token);

    if (!ordine) {
      return { success: false, error: "Token non valido" };
    }

    const prodotti = safeParse(ordine.prodotti_json);
    if (!prodotti.length) {
      return { success: false, error: "Nessun prodotto associato all'ordine" };
    }

    const prodottoId = prodotti[0].prodotto_id;

    const prodotto = db.prepare(`
      SELECT titolo, titolo_breve, file_consegna_url
      FROM prodotti
      WHERE id = ?
      LIMIT 1
    `).get(prodottoId);

    if (!prodotto || !prodotto.file_consegna_url) {
      return { success: false, error: "File non trovato" };
    }

    let raw = prodotto.file_consegna_url.trim();
    if (raw.startsWith("http")) raw = raw.split("/").pop();

    const filePath = path.join(FILES_DIR, raw);

    if (!fs.existsSync(filePath)) {
      return { success: false, error: "File non presente sul server" };
    }

    const nomeDownload = (prodotto.titolo || prodotto.titolo_breve || "prodotto") + ".pdf";

    console.log("⬇️ Download diretto pronto:", nomeDownload);

    return {
      success: true,
      filePath,
      filename: nomeDownload
    };

  } catch (err) {
    console.error("❌ Errore downloadDirect:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */

async function download(req) {
  console.log("[DEBUG download] alias download() → downloadAutenticato()");
  return downloadAutenticato(req);
}

async function downloadDirectAlias(req) {
  console.log("[DEBUG download] alias downloadDirectAlias() → downloadDirect()");
  return downloadDirect(req);
}

/* =========================================================
   NUOVO ALIAS — richiesto dalla diagnostica
   /api/vendite/downloadFile
========================================================= */
async function downloadFile(req) {
  console.log("[DEBUG download] alias downloadFile() → downloadAutenticato()");
  return downloadAutenticato(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  downloadAutenticato,
  downloadDirect,

  // alias compatibilità
  download,
  downloadDirectAlias,

  // nuovo alias richiesto
  downloadFile
};
