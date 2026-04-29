/* =========================================================
   FILE: app/server/routes/product-page.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Serve la pagina prodotto statica
========================================================= */

const path = require("path");

/* =========================================================
   FUNZIONE PRINCIPALE — productPage
========================================================= */
async function productPage(req) {
  const id = req.params?.id;

  try {
    const filePath = path.join(process.cwd(), "app/public/prodotto.html");

    if (typeof global.logEvent === "function") {
      global.logEvent("product_page_view", { id });
    }

    return {
      success: true,
      filePath,
      contentType: "text/html"
    };

  } catch (err) {
    console.error("❌ Errore productPage:", err);

    if (typeof global.logEvent === "function") {
      global.logEvent("product_page_error", {
        id,
        error: err?.message || "unknown"
      });
    }

    return {
      success: false,
      contentType: "text/plain",
      body: "Errore caricamento pagina prodotto"
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (ex GET /prodotto/:id)
========================================================= */
async function prodotto(req) {
  return productPage(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  productPage,
  prodotto
};
