/**
 * =========================================================
 * File: app/server/routes/api-vendite-download.cjs
 * Download sicuro dei prodotti acquistati (ID-based)
 * Compatibile con tabella prodotti 2026
 * =========================================================
 */

const express = require("express");
const path = require("path");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

// Percorso persistente dei file prodotto
const FILES_DIR = "/var/data/uploads/files";

/**
 * =========================================================
 * GET /api/vendite/download/:id
 * Protetto da auth-user
 * =========================================================
 */
router.get("/vendite/download/:id", authUser, (req, res) => {
  try {
    const userId = req.user.id;
    const prodottoId = parseInt(req.params.id, 10);

    if (!prodottoId) {
      return res.status(400).json({
        success: false,
        error: "ID prodotto mancante"
      });
    }

    // 1) Verifica che l’utente abbia acquistato il prodotto
    const stmt = db.prepare(`
      SELECT prodotti_json
      FROM ordini
      WHERE utente_id = ?
        AND stato = 'completato'
    `);

    const ordini = stmt.all(userId);

    let trovato = false;

    for (const o of ordini) {
      const prodotti = safeParse(o.prodotti_json);
      if (prodotti.some(p => p.prodotto_id === prodottoId)) {
        trovato = true;
        break;
      }
    }

    if (!trovato) {
      return res.status(403).json({
        success: false,
        error: "Non hai acquistato questo prodotto"
      });
    }

    // 2) Trova il file reale del prodotto
    const stmtProd = db.prepare(`
      SELECT 
        titolo,
        titolo_breve,
        descrizione_lunga,
        descrizione_breve,
        file_consegna_url
      FROM prodotti
      WHERE id = ?
      LIMIT 1
    `);

    const prodotto = stmtProd.get(prodottoId);

    if (!prodotto || !prodotto.file_consegna_url) {
      return res.status(404).json({
        success: false,
        error: "File non trovato"
      });
    }

    // Fallback automatici
    const titolo = prodotto.titolo || prodotto.titolo_breve || "Prodotto digitale";
    const descrizione = prodotto.descrizione_lunga || prodotto.descrizione_breve || "";

    // Percorso persistente
    const filePath = path.join(FILES_DIR, prodotto.file_consegna_url);

    // 3) Invia il file in download
    return res.download(filePath, titolo + ".pdf", err => {
      if (err) {
        console.error("❌ Errore download:", err);
        return res.status(500).json({
          success: false,
          error: "Errore durante il download"
        });
      }
    });

  } catch (err) {
    console.error("❌ Errore /vendite/download:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
});

/**
 * Helper sicuro per JSON
 */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

module.exports = router;
