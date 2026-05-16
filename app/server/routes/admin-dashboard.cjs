/* =========================================================
   FILE: app/server/routes/admin-dashboard.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Dashboard Admin — Vendite + Ordini + KPI
   PATCH 2027.1 — Auto‑Ottimizzazione Catalogo
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const categorieRimborso = R("modules/rimborso-categorie.cjs");

/* =========================================================
   🔥 NUOVO: require pipeline auto‑ottimizzazione
========================================================= */
const autoOpt = R("services/catalogo-auto-opt.cjs");

/* =========================================================
   FUNZIONE: adminDashboard
   (ex GET /admin/dashboard)
========================================================= */
async function adminDashboard(req) {
  console.log("[DEBUG adminDashboard] chiamato adminDashboard()");

  try {
    if (req.user?.ruolo !== "admin") {
      console.log("[DEBUG adminDashboard] accesso negato");
      return { success: false, error: "Accesso negato" };
    }

    const countOrdini = db.prepare(`SELECT COUNT(*) AS n FROM ordini`).get().n;
    if (countOrdini === 0) {
      db.prepare(`DELETE FROM vendite`).run();
      db.prepare(`DELETE FROM sqlite_sequence WHERE name='vendite'`).run();
    }

    /* =========================================================
       KPI VENDITE
    ========================================================== */
    const venditeKPI = db.prepare(`
      SELECT 
        COUNT(*) AS venditeTotali,
        COALESCE(SUM(prezzo_cent), 0) AS revenueTotale,
        COUNT(DISTINCT prodotto_id) AS prodottiVenduti
      FROM vendite
    `).get();

    const vendite30 = db.prepare(`
      SELECT DATE(created_at) AS giorno, SUM(prezzo_cent) AS revenue
      FROM vendite
      WHERE DATE(created_at) >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `).all();

    const topProdotti = db.prepare(`
      SELECT prodotto_id, COUNT(*) AS vendite, SUM(prezzo_cent) AS revenue
      FROM vendite
      GROUP BY prodotto_id
      ORDER BY vendite DESC
      LIMIT 10
    `).all();

    /* =========================================================
       🔥 NUOVO: vendite per prodotto (per pipeline)
    ========================================================== */
    const venditePerProdotto = db.prepare(`
      SELECT prodotto_id AS id, COUNT(*) AS vendite
      FROM vendite
      GROUP BY prodotto_id
    `).all();

    const venditeMap = {};
    venditePerProdotto.forEach(v => venditeMap[v.id] = v.vendite);

    /* =========================================================
       UTM
    ========================================================== */
    const utm = db.prepare(`
      SELECT utm_source AS source, utm_medium AS medium, utm_campaign AS campaign,
             referrer, COUNT(*) AS vendite
      FROM vendite
      WHERE utm_source IS NOT NULL OR referrer IS NOT NULL
      GROUP BY utm_source, utm_medium, utm_campaign, referrer
      ORDER BY vendite DESC
    `).all();

    /* =========================================================
       ORDINI COMPLETI
    ========================================================== */
    const ordini = db.prepare(`
      SELECT 
        o.id, o.utente_id, o.prodotti_json, o.totale_cent, o.stato,
        o.metodo_pagamento, o.data_ordine,
        u.email AS email_cliente, u.codice_fiscale,
        r.motivo AS rimborso_motivo, r.stato AS rimborso_stato
      FROM ordini o
      LEFT JOIN utenti u ON u.id = o.utente_id
      LEFT JOIN rimborsi r ON r.id = (
        SELECT id FROM rimborsi WHERE ordine_id = o.id ORDER BY id DESC LIMIT 1
      )
      ORDER BY o.data_ordine DESC
    `).all();

    const ordiniKPI = {
      totali: ordini.length,
      completati: ordini.filter(o => o.stato === "completato").length,
      annullati: ordini.filter(o => o.stato === "annullato").length
    };

    /* =========================================================
       ORIGINE SINTETICA
    ========================================================== */
    const venditeByUID = db.prepare(`
      SELECT uid, origine, utm_source, utm_medium, utm_campaign, referrer
      FROM vendite
    `).all();

    const origineMap = {};
    venditeByUID.forEach(v => origineMap[v.uid] = v);

    function origineSintetica(v) {
      if (!v) return "Direct";
      const src = (v.utm_source || "").toLowerCase();
      const med = (v.utm_medium || "").toLowerCase();
      const ref = (v.referrer || "").toLowerCase();
      const org = (v.origine || "").toLowerCase();

      if (src.includes("bot") || med.includes("bot") || org.includes("bot")) return "Bot";
      if (src.includes("email") || med.includes("email") || ref.includes("mail.")) return "Email";
      if (src.includes("insta") || ref.includes("instagram")) return "Instagram";
      if (src.includes("tiktok") || ref.includes("tiktok")) return "TikTok";
      if (src.includes("fb") || src.includes("face") || ref.includes("facebook")) return "Facebook";
      if (ref.includes("whatsapp")) return "WhatsApp";
      if (ref.includes("telegram")) return "Telegram";
      if (src.includes("yt") || src.includes("you") || ref.includes("youtube")) return "YouTube";

      if (src.includes("goo") || ref.includes("google")) {
        if (med.includes("cpc") || med.includes("ads")) return "Paid Ads";
        return "Organic Search";
      }

      if (med.includes("ads") || med.includes("cpc") || med.includes("paid")) return "Paid Ads";
      if (ref && !ref.includes("mewingmarket")) return "Referral";
      if (src.includes("site") || org.includes("sito") || med.includes("product_page")) return "Sito";

      return v.origine || "Direct";
    }

    function detectCategoriaRimborso(motivo) {
      if (!motivo) return null;
      const motivoLower = motivo.toLowerCase();
      const match =
        categorieRimborso.find(c =>
          c.keywords.some(k => motivoLower.includes(k.toLowerCase()))
        ) ||
        categorieRimborso.find(c => c.categoria === "altro");
      return match.categoria;
    }

    function safeParse(str) {
      try { return JSON.parse(str); }
      catch { return []; }
    }

    const ordiniParsed = ordini.map(o => {
      const prodotti = safeParse(o.prodotti_json);
      const uid = prodotti[0]?.uid || null;
      const origine = origineSintetica(origineMap[uid]);

      return {
        ...o,
        prodotti,
        rimborso: {
          motivo: o.rimborso_motivo,
          stato: o.rimborso_stato,
          categoria: detectCategoriaRimborso(o.rimborso_motivo)
        },
        origine_sintetica: origine
      };
    });

    /* =========================================================
       🔥 RISPOSTA COMPLETA
    ========================================================== */
    return {
      success: true,
      vendite: {
        kpi: {
          venditeTotali: venditeKPI.venditeTotali,
          revenueTotale: venditeKPI.revenueTotale / 100,
          prodottiVenduti: venditeKPI.prodottiVenduti
        },
        vendite30,
        topProdotti,
        utm,
        venditePerProdotto: venditeMap   // 🔥 nuovo campo
      },
      ordini: {
        kpi: ordiniKPI,
        lista: ordiniParsed
      }
    };

  } catch (err) {
    console.error("❌ Errore adminDashboard:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   🔥 NUOVO ENDPOINT: avvio pipeline auto‑ottimizzazione
========================================================= */
async function autoOptimize(req) {
  console.log("🚀 [AUTO-OPT] Richiesta avvio pipeline");

  if (req.user?.ruolo !== "admin") {
    return { success: false, error: "Accesso negato" };
  }

  const result = await autoOpt.autoOttimizzaCatalogo();
  return { success: true, log: result.log };
}

/* =========================================================
   ALIAS INTELLIGENTE — compatibilità frontend
========================================================= */
async function getDashboard(req) {
  console.log("[DEBUG adminDashboard] alias getDashboard() → adminDashboard()");
  return adminDashboard(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  adminDashboard,
  getDashboard,
  autoOptimize   // 🔥 nuovo export
};
