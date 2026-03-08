// =========================================================
// STRUCTURED DATA – AREA ADMIN (versione blindata)
// =========================================================

(function () {
  /* =========================================================
     SANITIZZAZIONE
  ========================================================== */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  function injectSchema(data) {
    try {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    } catch (err) {
      console.error("Errore injectSchema:", err);
    }
  }

  /* =========================================================
     1) ORGANIZATION (sempre presente, come nel sito)
  ========================================================== */
  injectSchema({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MewingMarket",
    "url": "https://www.mewingmarket.it",
    "logo": "https://www.mewingmarket.it/logo.png",
    "sameAs": [
      "https://www.instagram.com/mewingmarket",
      "https://www.tiktok.com/@mewingmarket",
      "https://www.youtube.com/@mewingmarket2",
      "https://www.facebook.com/profile.php?id=61584779793628",
      "https://x.com/mewingm8",
      "https://www.threads.net/@mewingmarket",
      "https://www.linkedin.com/company/mewingmarket"
    ]
  });

  /* =========================================================
     2) NESSUN ALTRO SCHEMA NELL’ADMIN
     - niente WebSite
     - niente CollectionPage
     - niente FAQ
     - niente Product
     - niente Breadcrumb
     - niente SearchAction
  ========================================================== */

})();
