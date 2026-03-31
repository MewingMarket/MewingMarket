/**
 * =========================================================
 * File: app/server/routes/api-vendite-download.cjs
 * Download sicuro dei prodotti acquistati (ID-based)
 * Versione 2026.97 — FIX filename + logs + sicurezza
 * =========================================================
 */

const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

// Percorso persistente dei file prodotto
const FILES_DIR = "/var/data/uploads/files";

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

    console.log("📥 Richiesta download prodotto:", prodottoId, "da utente:", userId);

    // =========================================================
    // 1) Verifica acquisto (solo ordini completati)
    // =========================================================
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
      console.log("❌ Download negato: prodotto non acquistato");
      return res.status(403).json({
        success: false,
        error: "Non hai acquistato questo prodotto"
      });
    }

    // =========================================================
    // 2) Recupera info prodotto
    // =========================================================
    const stmtProd = db.prepare(`
      SELECT 
        titolo,
        titolo_breve,
        file_consegna_url
      FROM prodotti
      WHERE id = ?
      LIMIT 1
    `);

    const prodotto = stmtProd.get(prodottoId);

    if (!prodotto || !prodotto.file_consegna_url) {
      console.log("❌ Nessun file_consegna_url nel DB");
      return res.status(404).json({
        success: false,
        error: "File non trovato"
      });
    }

    // =========================================================
    // 3) Normalizza filename (rimuove URL assoluti)
    // =========================================================
    let raw = prodotto.file_consegna_url.trim();

    // Se contiene URL → estrai solo il filename
    if (raw.startsWith("http")) {
      raw = raw.split("/").pop();
    }

    const filePath = path.join(FILES_DIR, raw);

    console.log("📄 File richiesto:", raw);
    console.log("📁 Percorso finale:", filePath);

    // =========================================================
    // 4) Controllo esistenza file
    // =========================================================
    if (!fs.existsSync(filePath)) {
      console.log("❌ File NON esiste su disco");
      return res.status(404).json({
        success: false,
        error: "File non presente sul server"
      });
    }

    // =========================================================
    // 5) Download
    // =========================================================
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
    console.error("❌ Errore /vendite/download:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
});

module.exports = router;
