/**
 * =========================================================
 * File: app/server/routes/api-vendite-download.cjs
 * Download sicuro dei prodotti acquistati (SQL)
 * =========================================================
 */

const express = require("express");
const path = require("path");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/vendite/download/:slug
 * Protetto da auth-user
 * =========================================================
 */
router.get("/vendite/download/:slug", authUser, (req, res) => {
  try {
    const userId = req.user.id;
    const slug = req.params.slug;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: "Slug mancante"
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
      if (prodotti.some(p => p.slug === slug)) {
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
      SELECT file_path
      FROM prodotti
      WHERE slug = ?
      LIMIT 1
    `);

    const prodotto = stmtProd.get(slug);

    if (!prodotto || !prodotto.file_path) {
      return res.status(404).json({
        success: false,
        error: "File non trovato"
      });
    }

    const filePath = path.resolve("app/data/files", prodotto.file_path);

    // 3) Invia il file in download
    return res.download(filePath, err => {
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
