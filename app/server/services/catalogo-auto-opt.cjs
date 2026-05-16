/* =========================================================
   FILE: app/server/services/catalogo-auto-opt.cjs
   DESCRIZIONE:
   Pipeline Auto‑Ottimizzazione Catalogo (AI)
   Versione 2027.1
========================================================= */

const path = require("path");
const ROOT = process.cwd();
const R = (p) => require(path.join(ROOT, "app", p));

/* =========================================================
   REQUIRE ASSOLUTI
========================================================= */
const catalogo = R("modules/catalogo-sql.cjs");
const ai = R("server/modules/ai.cjs");
const db = R("server/db/database.cjs");

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
async function autoOttimizzaCatalogo() {
  const log = [];
  log.push("🚀 Avvio pipeline Auto‑Ottimizzazione Catalogo…");

  const prodotti = catalogo.getAllProducts();
  const vendite = catalogo.getVenditePerProdotto();

  const oggi = new Date();
  const cutoff90 = new Date(oggi.getTime() - 90 * 86400000).toISOString().slice(0, 10);

  /* =========================================================
     CICLO PRODOTTI
  ========================================================== */
  for (const p of prodotti) {
    const id = p.id;
    const v = vendite[id] || 0;

    log.push(`\n📦 Prodotto #${id} — ${p.titolo}`);
    log.push(`   Vendite: ${v}`);

    /* ---------------------------------------------------------
       1) NASCONDI FLOP (0 vendite in 90 giorni)
    --------------------------------------------------------- */
    const vendite90 = db.prepare(`
      SELECT COUNT(*) AS n
      FROM vendite
      WHERE prodotto_id = ?
      AND DATE(created_at) >= DATE(?)
    `).get(id, cutoff90).n;

    if (vendite90 === 0) {
      log.push("   ❌ Nessuna vendita in 90 giorni → NASCONDO");
      catalogo.hideProduct(id);
      continue;
    }

    /* ---------------------------------------------------------
       2) AUMENTA PREZZO se vendite alte
    --------------------------------------------------------- */
    if (v >= 50) {
      const nuovoPrezzo = Math.round(p.prezzo_cent * 1.15);
      log.push(`   📈 Vendite alte → aumento prezzo a ${(nuovoPrezzo / 100).toFixed(2)}€`);
      catalogo.updateProductPrice(id, nuovoPrezzo);
    }

    /* ---------------------------------------------------------
       3) RIDUCI PREZZO se vendite basse
    --------------------------------------------------------- */
    if (v > 0 && v < 5) {
      const nuovoPrezzo = Math.round(p.prezzo_cent * 0.85);
      log.push(`   📉 Vendite basse → riduco prezzo a ${(nuovoPrezzo / 100).toFixed(2)}€`);
      catalogo.updateProductPrice(id, nuovoPrezzo);
    }

    /* ---------------------------------------------------------
       4) AGGIORNA DESCRIZIONE (AI)
       Solo se descrizione breve è troppo corta
    --------------------------------------------------------- */
    if ((p.descrizione_breve || "").length < 60) {
      log.push("   ✍️ Descrizione breve insufficiente → rigenero con AI");

      const prompt = `
Rigenera una descrizione breve efficace per un prodotto digitale.

Titolo: ${p.titolo}
Descrizione tecnica: ${p.descrizione_lunga}

Requisiti:
- massimo 160 caratteri
- orientata alla vendita
- chiara e professionale
`;

      const nuovaDesc = await ai.generateText(prompt);
      catalogo.updateProductDescription(id, nuovaDesc);
      log.push("   ✔️ Descrizione aggiornata");
    }

    /* ---------------------------------------------------------
       5) CONFIGURAZIONE CONSIGLIATA (competitor)
    --------------------------------------------------------- */
    if (p.configurazione_consigliata) {
      log.push("   🔧 Applico configurazione consigliata (competitor)");

      const cfg = p.config_json || {};
      cfg.suggerita = p.configurazione_consigliata;

      catalogo.updateProductConfig(id, cfg);
    }
  }

  log.push("\n✅ Pipeline completata.");
  return { log };
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  autoOttimizzaCatalogo
};
